#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [ValidateSet('prepare', 'stamp', 'verify')]
    [string] $Action = 'prepare',
    [string] $Base = 'origin/dev',
    [string] $Rounds = '',
    [string] $RepoRoot
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $RepoRoot) {
    $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

$gitDir = Join-Path $RepoRoot '.git'
$scratchDir = Join-Path $gitDir 'review-scratch'
$stampFile = Join-Path $gitDir 'review-stamp.json'
$headSha = (& git -C $RepoRoot rev-parse HEAD).Trim()

function Get-ChangedFiles([string] $BaseRef) {
    $mergeBase = (& git -C $RepoRoot merge-base $BaseRef HEAD 2>$null)
    if ($LASTEXITCODE -ne 0 -or -not $mergeBase) {
        $mergeBase = (& git -C $RepoRoot rev-parse HEAD~1 2>$null)
    }
    if (-not $mergeBase -or $mergeBase.Trim() -eq $headSha) {
        $mergeBase = (& git -C $RepoRoot rev-parse HEAD~1 2>$null)
    }
    $mergeBase = $mergeBase.Trim()
    $files = @(& git -C $RepoRoot diff --name-only --no-renames "$mergeBase...HEAD" | Where-Object { $_ -ne '' })
    return [pscustomobject]@{
        MergeBase = $mergeBase
        Files     = $files
        DocsOnly  = ($files.Count -gt 0 -and (@($files | Where-Object { $_ -notmatch '\.md$' }).Count -eq 0))
    }
}

if ($Action -eq 'prepare') {
    Write-Host ">>> [Step 1] Running 4 Automated Gates before dispatching R1, R2, and code-review..." -ForegroundColor Cyan
    & pwsh -NoProfile -File (Join-Path $PSScriptRoot 'Invoke-CodeReview.ps1') -RepoRoot $RepoRoot
    if ($LASTEXITCODE -ne 0) {
        throw "Automated gates failed. Fix gate errors before running R1/R2 review rounds."
    }

    if (Test-Path $scratchDir) { Remove-Item -Recurse -Force $scratchDir }
    New-Item -ItemType Directory -Force -Path $scratchDir | Out-Null

    $diffInfo = Get-ChangedFiles $Base
    $diffPath = Join-Path $scratchDir 'diff.patch'
    $filesPath = Join-Path $scratchDir 'files.txt'

    $diffContent = (& git -C $RepoRoot diff --no-color --no-renames "$($diffInfo.MergeBase)...HEAD") -join "`n"
    [System.IO.File]::WriteAllText($diffPath, $diffContent, (New-Object System.Text.UTF8Encoding($false)))
    [System.IO.File]::WriteAllText($filesPath, ($diffInfo.Files -join "`n"), (New-Object System.Text.UTF8Encoding($false)))

    $r1Lines = @(
        "Dispatch: Round 1 (R1 - Correctness, Validation and Security)",
        "RepoRoot: $RepoRoot",
        "HeadSHA: $headSha",
        "DiffPath: $diffPath",
        "FilesPath: $filesPath",
        "",
        "1. Read the changed file list at $filesPath and the diff at $diffPath.",
        "2. Risk focus for R1:",
        "   - Correctness bugs: wrong business logic, division by zero, null reference risks, missed edge cases.",
        "   - Security and Auth: missing [Authorize], trusting client-passed UserId instead of JWT claims, unauthorized project/task access.",
        "   - React and State: unguarded async calls, impure render logic (new Date() during render), synchronous setState inside useEffect.",
        "3. Output format (strict):",
        "   - First, list Declined candidates (- none or candidates set aside).",
        "   - Second, list Coverage with one line per file in $filesPath.",
        "   - Third, either 'Clean. No actionable findings in changed hunks.' OR finding blocks in Vietnamese with full accents (Severity, File, Why, Fix)."
    )

    $r2Lines = @(
        "Dispatch: Round 2 (R2 - Clean Architecture, Maintainability and UI/SCSS Scope)",
        "RepoRoot: $RepoRoot",
        "HeadSHA: $headSha",
        "DiffPath: $diffPath",
        "FilesPath: $filesPath",
        "",
        "1. Read the changed file list at $filesPath and the diff at $diffPath.",
        "2. Risk focus for R2:",
        "   - Clean Architecture: Domain must have zero dependencies; Application must only depend on Domain; Controllers must return DTOs, never EF Entities.",
        "   - Code Comments: Zero non-directive comments allowed.",
        "   - SCSS and Impeccable UI: CSS must be modular inside frontend/src/assets/styles/; -webkit-line-clamp must include standard line-clamp; text contrast on light cards must be dark (#0f172a).",
        "   - Duplicate API/service calls or copy-pasted logic blocks.",
        "3. Output format (strict):",
        "   - First, list Declined candidates (- none or candidates set aside).",
        "   - Second, list Coverage with one line per file in $filesPath.",
        "   - Third, either 'Clean. No actionable findings in changed hunks.' OR finding blocks in Vietnamese with full accents (Severity, File, Why, Fix)."
    )

    $crLines = @(
        "Dispatch: code-review Round (Post R1 and R2)",
        "RepoRoot: $RepoRoot",
        "HeadSHA: $headSha",
        "DiffPath: $diffPath",
        "FilesPath: $filesPath",
        "",
        "1. Read the diff at $diffPath and the file list at $filesPath.",
        "2. Look for two kinds of problems:",
        "   - Correctness bugs: wrong logic, missed case, broken caller, null or error path that fails.",
        "   - Cleanups: duplicate helper, code that can be simpler with the same behavior, needless repeated queries or loops.",
        "3. Output, with nothing before it:",
        "   Reviewed files: $($diffInfo.Files -join ', ')",
        "   Then 'No findings', or one block per finding in Vietnamese with full accents (Severity, File, Why, Fix)."
    )

    $r1File = Join-Path $scratchDir 'dispatch-R1.md'
    $r2File = Join-Path $scratchDir 'dispatch-R2.md'
    $crFile = Join-Path $scratchDir 'dispatch-code-review.md'

    [System.IO.File]::WriteAllText($r1File, ($r1Lines -join "`n"), (New-Object System.Text.UTF8Encoding($false)))
    [System.IO.File]::WriteAllText($r2File, ($r2Lines -join "`n"), (New-Object System.Text.UTF8Encoding($false)))
    [System.IO.File]::WriteAllText($crFile, ($crLines -join "`n"), (New-Object System.Text.UTF8Encoding($false)))

    $prepResult = [ordered]@{
        status    = 'ready'
        head      = $headSha
        mergeBase = $diffInfo.MergeBase
        fileCount = $diffInfo.Files.Count
        docsOnly  = $diffInfo.DocsOnly
        required  = if ($diffInfo.DocsOnly) { @('R1', 'R2') } else { @('R1', 'R2', 'code-review') }
        dispatch  = [ordered]@{
            R1         = $r1File
            R2         = $r2File
            codeReview = if ($diffInfo.DocsOnly) { $null } else { $crFile }
        }
    }
    Write-Host "`n>>> [Step 2] Dispatch files generated for R1, R2, and code-review:" -ForegroundColor Green
    Write-Host ($prepResult | ConvertTo-Json -Depth 4)
    exit 0
}

if ($Action -eq 'stamp') {
    $diffInfo = Get-ChangedFiles $Base
    $requiredRounds = if ($diffInfo.DocsOnly) { @('r1', 'r2') } else { @('r1', 'r2', 'code-review') }
    $providedRounds = @($Rounds.Split(',') | Where-Object { $_ -ne '' } | ForEach-Object { $_.Trim().ToLowerInvariant() })

    $missing = @($requiredRounds | Where-Object { $providedRounds -notcontains $_ })
    if ($missing.Count -gt 0) {
        Write-Host "STAMP REJECTED: Missing required review rounds: $($missing -join ', ')" -ForegroundColor Red
        Write-Host "Required sequence: Run R1 & R2 first, then run code-review round." -ForegroundColor Yellow
        exit 1
    }

    & pwsh -NoProfile -File (Join-Path $PSScriptRoot 'Invoke-CodeReview.ps1') -RepoRoot $RepoRoot
    if ($LASTEXITCODE -ne 0) {
        Write-Host "STAMP REJECTED: Automated Code Review Gates failed." -ForegroundColor Red
        exit 1
    }

    $stampData = [ordered]@{
        head      = $headSha
        rounds    = $providedRounds
        scope     = if ($diffInfo.DocsOnly) { 'docs-only' } else { 'full' }
        status    = 'passed'
        timestamp = [DateTimeOffset]::UtcNow.ToString('o')
    }
    [System.IO.File]::WriteAllText($stampFile, ($stampData | ConvertTo-Json -Depth 3), (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "STAMP CREATED FOR HEAD $headSha (rounds=$($providedRounds -join ','); scope=$($stampData.scope))" -ForegroundColor Green
    exit 0
}

if ($Action -eq 'verify') {
    Write-Host "=== [Pre-Push Gate] Verifying R1 + R2 + code-review Stamp for HEAD $headSha ===" -ForegroundColor Cyan
    if (-not (Test-Path $stampFile)) {
        Write-Host "PUSH BLOCKED: No review stamp found at .git/review-stamp.json!" -ForegroundColor Red
        Write-Host "You must run the 2 review rounds (R1, R2) followed by the code-review round before pushing:" -ForegroundColor Yellow
        Write-Host "  1. pwsh -NoProfile -File tools/Invoke-PrePushReview.ps1 -Action prepare" -ForegroundColor Yellow
        Write-Host "  2. Execute R1 and R2 rounds, then execute code-review round" -ForegroundColor Yellow
        Write-Host "  3. pwsh -NoProfile -File tools/Invoke-PrePushReview.ps1 -Action stamp -Rounds 'R1,R2,code-review'" -ForegroundColor Yellow
        exit 1
    }

    $stamp = Get-Content -Raw -Path $stampFile | ConvertFrom-Json
    if ($stamp.head -ne $headSha) {
        Write-Host "PUSH BLOCKED: Review stamp is stale (stamped for $($stamp.head), but current HEAD is $headSha)!" -ForegroundColor Red
        Write-Host "Re-run R1, R2, and code-review rounds for the new commit and re-stamp." -ForegroundColor Yellow
        exit 1
    }

    $diffInfo = Get-ChangedFiles $Base
    $requiredRounds = if ($diffInfo.DocsOnly) { @('r1', 'r2') } else { @('r1', 'r2', 'code-review') }
    $stampedRounds = @($stamp.rounds | ForEach-Object { $_.ToString().ToLowerInvariant() })
    $missing = @($requiredRounds | Where-Object { $stampedRounds -notcontains $_ })

    if ($missing.Count -gt 0 -or $stamp.status -ne 'passed') {
        Write-Host "PUSH BLOCKED: Stamp is missing required rounds ($($missing -join ', ')) or status is not 'passed'." -ForegroundColor Red
        exit 1
    }

    Write-Host "OK: Valid review stamp verified for HEAD $headSha (rounds: $($stampedRounds -join ', '))." -ForegroundColor Green
    & pwsh -NoProfile -File (Join-Path $PSScriptRoot 'Invoke-CodeReview.ps1') -RepoRoot $RepoRoot
    exit $LASTEXITCODE
}
