#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [string] $Base = '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
    [string] $RepoRoot
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $RepoRoot) {
    $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

$failedGates = New-Object System.Collections.Generic.List[string]

Write-Host "=== [Gate 1/4] Build Gate: Backend (.NET 10) ===" -ForegroundColor Cyan
Push-Location (Join-Path $RepoRoot 'backend')
try {
    $buildOut = & dotnet build --nologo -v:minimal 2>&1
    if ($LASTEXITCODE -ne 0) {
        $buildOut | ForEach-Object { Write-Host $_ }
        $failedGates.Add('backend-build-gate')
    } else {
        $warnLines = @($buildOut | Where-Object { $_ -match ':\s*warning\s+[A-Z]+\d+' })
        if ($warnLines.Count -gt 0) {
            $warnLines | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
            $failedGates.Add('backend-warning-gate')
        } else {
            Write-Host "OK: Backend build succeeded with 0 warnings and 0 errors." -ForegroundColor Green
        }
    }
} finally {
    Pop-Location
}

Write-Host "`n=== [Gate 2/4] Lint & Build Gate: Frontend (React + Vite + Oxlint) ===" -ForegroundColor Cyan
Push-Location (Join-Path $RepoRoot 'frontend')
try {
    $lintOut = & npm run lint 2>&1
    if ($LASTEXITCODE -ne 0 -or ($lintOut -join "`n") -notmatch 'Found 0 warnings and 0 errors') {
        $lintOut | ForEach-Object { Write-Host $_ }
        $failedGates.Add('frontend-lint-gate')
    } else {
        Write-Host "OK: Oxlint passed (0 warnings, 0 errors)." -ForegroundColor Green
    }

    $feBuildOut = & npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        $feBuildOut | ForEach-Object { Write-Host $_ }
        $failedGates.Add('frontend-build-gate')
    } else {
        Write-Host "OK: Vite production build succeeded." -ForegroundColor Green
    }
} finally {
    Pop-Location
}

Write-Host "`n=== [Gate 3/4] No-Code-Comments Gate (Test-NoCodeComments.ps1) ===" -ForegroundColor Cyan
$commentScript = Join-Path $PSScriptRoot 'Test-NoCodeComments.ps1'
try {
    & pwsh -NoProfile -File $commentScript -RepoRoot $RepoRoot -Base $Base
    if ($LASTEXITCODE -ne 0) {
        $failedGates.Add('no-code-comments-gate')
    }
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    $failedGates.Add('no-code-comments-gate')
}

Write-Host "`n=== [Gate 4/4] Clean Repo & Content Hygiene Gate ===" -ForegroundColor Cyan
$leftoverPrFiles = @(Get-ChildItem -Path $RepoRoot -Filter ".pr_*" -Force -ErrorAction SilentlyContinue)
if ($leftoverPrFiles.Count -gt 0) {
    $leftoverPrFiles | ForEach-Object { Write-Host "Leftover temp file: $($_.Name)" -ForegroundColor Red }
    $failedGates.Add('clean-repo-gate')
}
$externalRefs = @(& git -C $RepoRoot grep -i "talgent" -- "backend/" "frontend/" "docs/" 2>$null)
if ($externalRefs.Count -gt 0) {
    $externalRefs | ForEach-Object { Write-Host "External reference found: $_" -ForegroundColor Red }
    $failedGates.Add('clean-repo-gate')
}
if (-not ($failedGates -contains 'clean-repo-gate')) {
    Write-Host "OK: Repository hygiene verified (no temp files, no external project leaks)." -ForegroundColor Green
}

Write-Host "`n==========================================" -ForegroundColor Cyan
if ($failedGates.Count -gt 0) {
    Write-Host "CODE REVIEW GATES FAILED: $($failedGates -join ', ')" -ForegroundColor Red
    exit 1
} else {
    Write-Host "ALL 4 AUTOMATED CODE REVIEW GATES PASSED!" -ForegroundColor Green
    exit 0
}
