#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [string] $Base = 'HEAD',
    [string] $Head,
    [string] $RepoRoot
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $RepoRoot) {
    $RepoRoot = Join-Path $PSScriptRoot '..'
}
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

$extensions = @('cs', 'cshtml', 'js', 'ts', 'tsx', 'jsx', 'scss', 'css', 'sql', 'ps1', 'sh', 'kt', 'java', 'swift', 'py')
$pathspecs = @($extensions | ForEach-Object { "*.$_" })
$skipPath = [regex]::new('(?i)(^|/)(node_modules|vendors?|bin|obj|dist|packages)/|\.min\.(js|css)$|\.(designer|g|g\.i|generated)\.cs$|(^|/)Migrations/[^/]*Snapshot\.cs$|\.d\.ts$')
$generatedMarker = [regex]::new('(?i)<auto-?generated|@generated|code generated')
$xmlDocPath = [regex]::new('^Talgent\.Webhook/.*\.cs$')
$quickScan = [regex]::new('//|/\*|#|--|<!--|@\*|"""|''''''|`|@"|@''|<<')
$headerLine = [regex]::new('(?i)^(spdx-license-identifier|copyright|licensed under|permission is hereby|@license)')
$directive = [regex]::new('(?i)^(eslint-(disable|enable)|stylelint-(disable|enable)|prettier-ignore|@ts-expect-error\s+\S.{2,}|noqa|type:\s*ignore|pylint:|nosec|nolint|noinspection|resharper |swiftlint:|swift-tools-version|shellcheck |istanbul |c8 |webpack(ChunkName|Mode|Prefetch|Preload)|<auto-?generated|@generated|code generated|<reference |requires\s+-|[#@]\s*sourceMappingURL=|-\*-|coding[:=]|vim:)')
$urlScheme = [regex]::new('(?i)\b(https?|ftp|ftps|sftp|file|wss?|ssh|git|data|mailto|chrome-extension):$')
$whyComment = [regex]::new('(?i)^Workaround:\s*(https?://\S+|[A-Za-z][\w.-]*#\d+)')
$markerStart = [regex]::new('^(///|//|/\*\*|/\*|<!--|<#|@\*|#|--|"""|'''''')\s*')
$markerEnd = [regex]::new('\s*(\*/|-->|#>|\*@)$')
$codeLike = [regex]::new('[;{}]\s*$|^[\w.]+\(.*\)\s*;?$|^(var|let|const|if|else|for|foreach|while|return|using|public|private|protected|function|class|import|SELECT|INSERT|UPDATE|DELETE)\b|^\$\w+\s*=|^[\w.\[\]]+\s*=\s*\S')

function Get-LexerConfig([string] $Extension) {
    $cfg = @{
        Slash = $false; Dash = $false; Hash = $false; Block = $false; Razor = $false; Html = $false
        PsBlock = $false; Sq = $true; Dq = $true; Bt = $false; SqEsc = 'backslash'; DqEsc = 'backslash'
        Verbatim = $false; Raw = $false; PsHere = $false; PyTriple = $false; Heredoc = $false
    }
    switch ($Extension) {
        'cs' { $cfg.Slash = $true; $cfg.Block = $true; $cfg.Verbatim = $true; $cfg.Raw = $true }
        'cshtml' { $cfg.Slash = $true; $cfg.Block = $true; $cfg.Razor = $true; $cfg.Html = $true; $cfg.Sq = $false }
        { $_ -in 'js', 'ts', 'tsx', 'jsx' } { $cfg.Slash = $true; $cfg.Block = $true; $cfg.Bt = $true }
        { $_ -in 'kt', 'java' } { $cfg.Slash = $true; $cfg.Block = $true; $cfg.Raw = $true }
        'swift' { $cfg.Slash = $true; $cfg.Block = $true; $cfg.Raw = $true; $cfg.Sq = $false }
        'scss' { $cfg.Slash = $true; $cfg.Block = $true }
        'css' { $cfg.Block = $true }
        'sql' { $cfg.Dash = $true; $cfg.Block = $true; $cfg.SqEsc = 'double'; $cfg.DqEsc = 'none' }
        'ps1' { $cfg.Hash = $true; $cfg.PsBlock = $true; $cfg.PsHere = $true; $cfg.SqEsc = 'double'; $cfg.DqEsc = 'backtick' }
        'sh' { $cfg.Hash = $true; $cfg.Heredoc = $true; $cfg.SqEsc = 'none' }
        'py' { $cfg.Hash = $true; $cfg.PyTriple = $true }
    }
    return $cfg
}

function Skip-Quoted([string] $Text, [int] $Start, [string] $Quote, [string] $Esc) {
    $i = $Start + 1
    while ($i -lt $Text.Length) {
        $ch = [string] $Text[$i]
        if ($Esc -eq 'backslash' -and $ch -eq '\') { $i += 2; continue }
        if ($Esc -eq 'backtick' -and $ch -eq '`') { $i += 2; continue }
        if ($ch -eq $Quote) {
            if ($Esc -eq 'double' -and ($i + 1) -lt $Text.Length -and [string] $Text[$i + 1] -eq $Quote) { $i += 2; continue }
            return $i + 1
        }
        $i++
    }
    return -1
}

function Find-Close([string] $Text, [int] $From, [string] $Close, [bool] $Doubled) {
    $i = $From
    while ($i -le $Text.Length) {
        $p = $Text.IndexOf($Close, $i, [System.StringComparison]::Ordinal)
        if ($p -lt 0) { return -1 }
        if ($Doubled -and ($p + 1) -lt $Text.Length -and $Text[$p + 1] -eq $Close[0]) { $i = $p + 2; continue }
        return $p
    }
    return -1
}

function Find-HunkComments([string[]] $Lines, [int] $FirstLine, [hashtable] $Cfg) {
    $found = New-Object System.Collections.Generic.List[object]
    $multi = $false
    $close = ''
    $doubled = $false
    $here = $false
    $heredoc = $null
    for ($li = 0; $li -lt $Lines.Count; $li++) {
        $text = $Lines[$li]
        $lineNo = $FirstLine + $li
        $n = $text.Length
        $i = 0
        if ($null -ne $heredoc) {
            if ($text.Trim() -eq $heredoc) { $heredoc = $null }
            continue
        }
        if ($multi) {
            if ($here) {
                if (-not $text.StartsWith($close)) { continue }
                $multi = $false
                $here = $false
                $i = $close.Length
            }
            else {
                $p = Find-Close $text 0 $close $doubled
                if ($p -lt 0) { continue }
                $multi = $false
                $i = $p + $close.Length
            }
        }
        elseif (-not $quickScan.IsMatch($text)) {
            continue
        }
        while ($i -lt $n) {
            $c = [string] $text[$i]
            $next = if (($i + 1) -lt $n) { [string] $text[$i + 1] } else { '' }
            $prev = if ($i -gt 0) { [string] $text[$i - 1] } else { '' }
            $tail = $text.Substring($i)

            if ($Cfg.PyTriple -and ($c -eq '"' -or $c -eq "'") -and $tail.StartsWith($c * 3)) {
                if ($text.Substring(0, $i).Trim() -eq '') {
                    $found.Add([pscustomobject]@{ Line = $lineNo; Text = $tail.TrimEnd(); Closed = $true; Kind = 'doc-comment' })
                }
                $p = Find-Close $text ($i + 3) ($c * 3) $false
                if ($p -lt 0) { $multi = $true; $close = $c * 3; $doubled = $false; $i = $n } else { $i = $p + 3 }
                continue
            }
            if ($c -eq '"' -and $Cfg.Dq) {
                if ($Cfg.Raw -and $tail.StartsWith('"""')) {
                    $p = Find-Close $text ($i + 3) '"""' $false
                    if ($p -lt 0) { $multi = $true; $close = '"""'; $doubled = $false; $i = $n } else { $i = $p + 3 }
                    continue
                }
                if ($Cfg.Verbatim -and ($prev -eq '@' -or ($i -gt 1 -and $prev -eq '$' -and [string] $text[$i - 2] -eq '@'))) {
                    $p = Find-Close $text ($i + 1) '"' $true
                    if ($p -lt 0) { $multi = $true; $close = '"'; $doubled = $true; $i = $n } else { $i = $p + 1 }
                    continue
                }
                if ($Cfg.PsHere -and $prev -eq '@' -and $tail.Substring(1).Trim() -eq '') {
                    $multi = $true; $here = $true; $close = '"@'; $i = $n
                    continue
                }
                $end = Skip-Quoted $text $i '"' $Cfg.DqEsc
                if ($end -lt 0) { break }
                $i = $end
                continue
            }
            if ($c -eq "'" -and $Cfg.Sq) {
                if ($Cfg.PsHere -and $prev -eq '@' -and $tail.Substring(1).Trim() -eq '') {
                    $multi = $true; $here = $true; $close = "'@"; $i = $n
                    continue
                }
                $end = Skip-Quoted $text $i "'" $Cfg.SqEsc
                if ($end -lt 0) { break }
                $i = $end
                continue
            }
            if ($c -eq '`' -and $Cfg.Bt) {
                $end = Skip-Quoted $text $i '`' 'backslash'
                if ($end -lt 0) { $multi = $true; $close = '`'; $doubled = $false; $i = $n; continue }
                $i = $end
                continue
            }

            if (($Cfg.Slash -and $c -eq '/' -and $next -eq '/' -and ($prev -ne ':' -or -not $urlScheme.IsMatch($text.Substring(0, $i)))) -or
                ($Cfg.Dash -and $c -eq '-' -and $next -eq '-') -or
                ($Cfg.Hash -and $c -eq '#' -and ($i -eq 0 -or $prev -match '[\s;(|&]') -and -not ($Cfg.PsBlock -and $next -eq '>'))) {
                $found.Add([pscustomobject]@{ Line = $lineNo; Text = $tail.TrimEnd(); Closed = $true; Kind = '' })
                break
            }

            $closeTok = $null
            if ($Cfg.Block -and $c -eq '/' -and $next -eq '*') { $closeTok = '*/' }
            elseif ($Cfg.PsBlock -and $c -eq '<' -and $next -eq '#') { $closeTok = '#>' }
            elseif ($Cfg.Razor -and $c -eq '@' -and $next -eq '*') { $closeTok = '*@' }
            elseif ($Cfg.Html -and $tail.StartsWith('<!--')) { $closeTok = '-->' }
            if ($closeTok) {
                $openLen = if ($closeTok -eq '-->') { 4 } else { 2 }
                $p = Find-Close $text ($i + $openLen) $closeTok $false
                if ($p -lt 0) {
                    $found.Add([pscustomobject]@{ Line = $lineNo; Text = $tail.TrimEnd(); Closed = $false; Kind = '' })
                    $multi = $true; $close = $closeTok; $doubled = $false; $i = $n
                }
                else {
                    $len = $p + $closeTok.Length - $i
                    $found.Add([pscustomobject]@{ Line = $lineNo; Text = $text.Substring($i, $len); Closed = $true; Kind = '' })
                    $i = $p + $closeTok.Length
                }
                continue
            }

            if ($Cfg.Heredoc -and $c -eq '<' -and $next -eq '<' -and $prev -ne '<' -and $text.Substring(0, $i) -notmatch '\(\(' -and $tail -match '^<<-?\s*[''"]?([A-Za-z_]\w*)[''"]?') {
                $heredoc = $Matches[1]
                break
            }
            $i++
        }
    }
    return $found
}

function Test-AllowedComment($Finding, [string] $Path) {
    $text = $Finding.Text
    if ($Finding.Line -eq 1 -and $text.StartsWith('#!')) { return $true }
    if ($text.StartsWith('///') -and -not $text.StartsWith('////') -and $xmlDocPath.IsMatch($Path)) { return $true }
    $body = $markerEnd.Replace($markerStart.Replace($text, ''), '')
    if ($directive.IsMatch($body)) { return $true }
    if ($Finding.Line -le 15 -and $headerLine.IsMatch($body)) { return $true }
    if ($Finding.Closed -and $whyComment.IsMatch($body)) { return $true }
    return $false
}

function Get-CommentKind($Finding) {
    if ($Finding.Kind) { return $Finding.Kind }
    $text = $Finding.Text
    if (($text.StartsWith('///') -and -not $text.StartsWith('////')) -or ($text.StartsWith('/**') -and -not $text.StartsWith('/**/'))) {
        return 'doc-comment'
    }
    $body = $markerEnd.Replace($markerStart.Replace($text, ''), '')
    if ($codeLike.IsMatch($body)) { return 'commented-out-code' }
    return 'comment'
}

function Get-FileHeadLines([string] $Path) {
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($Head) {
            $lines = & git -C $RepoRoot show "${Head}:$Path" 2>$null
            return @($lines | Select-Object -First 15)
        }
        $full = Join-Path $RepoRoot $Path
        if (-not (Test-Path -LiteralPath $full)) { return @() }
        return @([System.IO.File]::ReadLines($full) | Select-Object -First 15)
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
}

function Test-SkippedFile([string] $Path) {
    if ($skipPath.IsMatch($Path)) { return $true }
    $ext = [System.IO.Path]::GetExtension($Path).TrimStart('.').ToLowerInvariant()
    if ($ext -eq 'css') {
        $source = [System.IO.Path]::ChangeExtension($Path, 'scss').Replace('\', '/')
        if ($Head) {
            & git -C $RepoRoot cat-file -e "${Head}:$source" 2>$null
            if ($LASTEXITCODE -eq 0) { return $true }
        }
        elseif (Test-Path -LiteralPath (Join-Path $RepoRoot $source)) { return $true }
    }
    foreach ($line in (Get-FileHeadLines $Path)) {
        if ($generatedMarker.IsMatch([string] $line)) { return $true }
    }
    return $false
}

function Invoke-Git([string[]] $GitArguments) {
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $out = & git -C $RepoRoot -c core.quotePath=false @GitArguments 2>&1
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArguments -join ' ') failed (exit ${LASTEXITCODE}): $($out -join ' ')"
    }
    return @($out | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] })
}

$range = if ($Head) { "$Base...$Head" } else { $Base }
$raw = Invoke-Git (@('diff', '--no-color', '-U0', '-M', '--diff-filter=ACMR', $range, '--') + $pathspecs)

$hunksByPath = [ordered]@{}
$path = $null
$hunk = $null
$inHeader = $false
foreach ($diffLine in $raw) {
    if ($diffLine.StartsWith('diff --git ')) {
        $inHeader = $true
        $path = $null
        $hunk = $null
        continue
    }
    if ($inHeader -and -not $diffLine.StartsWith('@@')) {
        if ($diffLine.StartsWith('+++ ')) {
            $candidate = $diffLine.Substring(4).TrimEnd("`t")
            $path = if ($candidate.StartsWith('b/')) { $candidate.Substring(2) } else { $null }
        }
        continue
    }
    $inHeader = $false
    if ($diffLine -match '^@@ -\S+ \+(\d+)') {
        if ($path) {
            $hunk = @{ First = [int] $Matches[1]; Lines = New-Object System.Collections.Generic.List[string] }
            if (-not $hunksByPath.Contains($path)) { $hunksByPath[$path] = New-Object System.Collections.Generic.List[object] }
            $hunksByPath[$path].Add($hunk)
        }
        continue
    }
    if ($hunk -and $diffLine.StartsWith('+')) {
        $hunk.Lines.Add($diffLine.Substring(1))
    }
}

if (-not $Head) {
    $untracked = Invoke-Git (@('ls-files', '--others', '--exclude-standard', '--') + $pathspecs)
    foreach ($file in $untracked) {
        $full = Join-Path $RepoRoot $file
        if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { continue }
        $lines = New-Object System.Collections.Generic.List[string]
        foreach ($line in [System.IO.File]::ReadAllLines($full)) { $lines.Add($line) }
        $hunksByPath[$file] = New-Object System.Collections.Generic.List[object]
        $hunksByPath[$file].Add(@{ First = 1; Lines = $lines })
    }
}

$findings = New-Object System.Collections.Generic.List[string]
foreach ($file in $hunksByPath.Keys) {
    if (Test-SkippedFile $file) { continue }
    $ext = [System.IO.Path]::GetExtension($file).TrimStart('.').ToLowerInvariant()
    $cfg = Get-LexerConfig $ext
    foreach ($h in $hunksByPath[$file]) {
        foreach ($finding in (Find-HunkComments $h.Lines.ToArray() $h.First $cfg)) {
            if (Test-AllowedComment $finding $file) { continue }
            $shown = if ($finding.Text.Length -gt 100) { $finding.Text.Substring(0, 100) } else { $finding.Text }
            $findings.Add("${file}:$($finding.Line): no-code-comments: $(Get-CommentKind $finding): $shown")
        }
    }
}

if ($findings.Count -gt 0) {
    $findings | ForEach-Object { Write-Host $_ }
    Write-Host ''
    Write-Host 'Code is the source of truth. Delete the comment. Rename the symbol, extract a method, or add a test instead.'
    Write-Host 'Allowed: tool directives, file headers and licenses, auto-generated markers, and one line "Workaround: <url or Repo#n>".'
    Write-Host 'Rules: KB/code_style/no-code-comments.md'
    exit 1
}

Write-Host "OK: no code comments added (diff vs $range)"
exit 0
