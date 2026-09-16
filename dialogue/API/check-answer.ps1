# check-answer.ps1 - универсальный монитор ответов в dialogue/ (dialogue/API)
# Следит за dialogue/NNN-slug/ANSWER.md на main (GitLab REST, raw-запрос, без git clone).
# Поведение:
#   404               -> тихо, exit 0
#   sha1 без измен.   -> тихо, exit 0
#   новый / изменён   -> копия в <OutDir>\dialogue-NNN-answer.md + sha1-state + уведомление
#                          (Windows toast; на не-Windows строка "NOTIFY | ..." в stdout)
# Использование:
#   powershell -NoProfile -ExecutionPolicy Bypass -File check-answer.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File check-answer.ps1 -ThreadPath "dialogue/001-.../ANSWER.md" -OutDir "C:\me\docs"
#   powershell -NoProfile -ExecutionPolicy Bypass -File check-answer.ps1 -Demo
# Креды: переменная окружения GITLAB_TOKEN (имя переменной - параметр -TokenEnv).
#
# Автор: Ava @ opencode/qwen3.8-27b, оператор: <redacted for public repository>, 2026-08-28.

param(
    [switch]$Demo,
    [string]$BaseUrl = "https://gitlab.example.com",
    [string]$ProjectId = "1",
    [string]$ThreadPath = "dialogue/NNN-slug/ANSWER.md",
    [string]$OutDir = ".",
    [string]$TokenEnv = "GITLAB_TOKEN"
)

$ErrorActionPreference = "Stop"

$Num = (($ThreadPath -split "/")[-2] -replace '^(\d+).*', '$1')
$TargetFile = Join-Path $OutDir "dialogue-${Num}-answer.md"
$StateFile = Join-Path $OutDir ".dialogue-${Num}-answer.sha1"

function Send-Notify {
    param([string]$Title, [string]$Message)
    $shown = $false
    $isWin = ($PSVersionTable.PSVersion.Major -le 5) -or $env:OS
    if ($isWin) {
        try {
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type -AssemblyName System.Drawing
            $Toast = New-Object System.Windows.Forms.NotifyIcon
            $Toast.Icon = [System.Drawing.SystemIcons]::Information
            $Toast.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
            $Toast.BalloonTipTitle = $Title
            $Toast.BalloonTipText = $Message
            $Toast.Visible = $true
            $Toast.ShowBalloonTip(10000)
            Start-Sleep -Seconds 11
            $Toast.Dispose()
            $shown = $true
        } catch { $shown = $false }
    }
    if (-not $shown) {
        Write-Output "NOTIFY | $Title | $Message"
    }
}

try {
    if ($Demo) {
        Write-Output "[Demo] Проверка уведомления"
        Send-Notify -Title "dialogue/${Num}" -Message "[Demo] Ответ в треде dialogue/${Num}. Копия: dialogue-${Num}-answer.md"
        Write-Output "[Demo] Готово"
        exit 0
    }

    $Token = [Environment]::GetEnvironmentVariable($TokenEnv, "User")
    if (-not $Token) { $Token = [Environment]::GetEnvironmentVariable($TokenEnv) }
    if (-not $Token) {
        Write-Output "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): dialogue/${Num}: token ${TokenEnv} not found, skipped"
        exit 0
    }

    $wc = New-Object Net.WebClient
    $wc.Headers.Add("PRIVATE-TOKEN", $Token)
    $wc.Encoding = [Text.Encoding]::UTF8
    $RawPath = [uri]::EscapeDataString($ThreadPath)

    $contentBytes = $null
    try {
        $contentBytes = $wc.DownloadData("$BaseUrl/api/v4/projects/$ProjectId/repository/files/$RawPath/raw?ref=main")
    } catch {
        $code = 0
        $httpEx = $null
        if ($_.Exception.Response) { $httpEx = $_.Exception }
        elseif ($_.Exception.InnerException -and $_.Exception.InnerException.Response) { $httpEx = $_.Exception.InnerException }
        if ($httpEx) { $code = [int]$httpEx.Response.StatusCode }
        if ($code -eq 404) {
            Write-Output "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): dialogue/${Num}: no answer yet (HTTP 404)"
            exit 0
        }
        Write-Output "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): dialogue/${Num}: request error (HTTP $code)"
        exit 0
    }

    $ms = New-Object IO.MemoryStream
    $ms.Write($contentBytes, 0, $contentBytes.Length)
    $ms.Position = 0
    $sha = (Get-FileHash -InputStream $ms -Algorithm SHA1).Hash

    $prevSha = $null
    if (Test-Path -LiteralPath $StateFile) {
        $prevSha = (Get-Content -LiteralPath $StateFile -Raw).Trim()
    }

    if ($sha -eq $prevSha) {
        Write-Output "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): dialogue/${Num}: unchanged, no notify"
        exit 0
    }

    if (-not (Test-Path -LiteralPath $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

    $text = [Text.Encoding]::UTF8.GetString($contentBytes)
    $header = "<!-- ANSWER.md from $BaseUrl, thread $ThreadPath. -->`n" +
              "<!-- Saved by check-answer.ps1 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), sha1=$sha -->`n`n"
    Set-Content -LiteralPath $TargetFile -Value ($header + $text) -Encoding UTF8
    Set-Content -LiteralPath $StateFile -Value $sha -Encoding ASCII
    Write-Output "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): dialogue/${Num}: NEW ANSWER (sha1=$sha) -> $TargetFile"

    if (-not $prevSha) {
        Send-Notify -Title "dialogue/${Num}: answer arrived" -Message "ANSWER.md appeared in thread dialogue/${Num}. Copy: $TargetFile"
    } else {
        Send-Notify -Title "dialogue/${Num}: answer updated" -Message "ANSWER.md in thread dialogue/${Num} changed. Updated copy: $TargetFile"
    }
}
catch {
    Write-Host "check-answer error: $($_.Exception.Message)"
    exit 1
}
