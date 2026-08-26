# FetchMrDiff.ps1 — собрать дифф GitLab MR в файл для отправки Напарнику
<#
.SYNOPSIS
    Выгружает полный дифф merge request указанного GitLab-проекта в текстовый файл.

.DESCRIPTION
    Получает diff через GitLab API (glab) и сохраняет в файл (UTF-8 с BOM).
    Файл затем передаётся Напарнику через Naparnik.ps1 ask -QuestionFile.

.PARAMETER MrIid
    Номер merge request (обязательный).

.PARAMETER Project
    Проект в формате group/repo или числовой ID. Нет значения по умолчанию —
    задайте его явно или через $env:NAPARNIK_GITLAB_PROJECT.

.PARAMETER OutputFile
    Куда сохранить дифф. По умолчанию %TEMP%\mr<IID>_diff.txt

.PARAMETER GitLabHost
    GitLab host. По умолчанию $env:NAPARNIK_GITLAB_HOST, иначе gitlab.com.

.EXAMPLE
    .\FetchMrDiff.ps1 -MrIid 2138 -Project "mygroup/myrepo" -GitLabHost "gitlab.example.com"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [int]$MrIid,

    [Parameter(Mandatory=$false)]
    [string]$Project = $env:NAPARNIK_GITLAB_PROJECT,

    [Parameter(Mandatory=$false)]
    [string]$OutputFile,

    [Parameter(Mandatory=$false)]
    [string]$GitLabHost = $(if ($env:NAPARNIK_GITLAB_HOST) { $env:NAPARNIK_GITLAB_HOST } else { "gitlab.com" })
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if ([string]::IsNullOrWhiteSpace($Project)) {
    Write-Output "ERR: укажите -Project (group/repo) или задайte `$env:NAPARNIK_GITLAB_PROJECT"
    exit 2
}

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
    $OutputFile = Join-Path $env:TEMP "mr${MrIid}_diff.txt"
}

$glab = "$env:LOCALAPPDATA\Programs\GLab\glab.exe"
if (-not (Test-Path -LiteralPath $glab)) { $glab = "glab" }

$projInfo = & $glab api --hostname $GitLabHost "projects/$($Project -replace '/', '%2F')" 2>$null | Out-String
$projId = $null
try {
    $projObj = $projInfo | ConvertFrom-Json
    $projId = $projObj.id
} catch { }
if (-not $projId) {
    Write-Output "ERR: не удалось определить ID проекта $Project на $GitLabHost"
    exit 2
}

$apiUrl = "projects/$projId/merge_requests/$MrIid/changes"
$raw = & $glab api --hostname $GitLabHost $apiUrl 2>$null
$j = $raw | Out-String | ConvertFrom-Json
if (-not $j.changes) {
    Write-Output "ERR: MR !$MrIid не найден или не отдаёт changes"
    exit 2
}

Write-Output "MR !$MrIid  $($j.title)  (changes: $($j.changes.Count))"

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# MR !$MrIid $($j.title)")
[void]$sb.AppendLine("")
foreach ($c in $j.changes) {
    [void]$sb.AppendLine("### FILE: $($c.new_path)")
    [void]$sb.AppendLine('```diff')
    [void]$sb.AppendLine($c.diff)
    [void]$sb.AppendLine('```')
    [void]$sb.AppendLine("")
}

# UTF-8 WITH BOM — data file, BOM is harmless for UTF-8 readers and keeps
# downstream tools (incl. Naparnik.ps1's QuestionFile reader) unambiguous.
[System.IO.File]::WriteAllText($OutputFile, $sb.ToString(), (New-Object System.Text.UTF8Encoding($true)))
Write-Output "Diff saved: $OutputFile ($((Get-Item $OutputFile).Length) bytes)"
