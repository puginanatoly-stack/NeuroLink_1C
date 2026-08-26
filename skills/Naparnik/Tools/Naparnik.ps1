# Naparnik.ps1 — 1С:Напарник API client (internet access, no local MCP server)
# Direct access to https://code.1c.ai — bypasses the local onec-code-check-mcp
# server (port 8007) entirely. Use when that server is down or unconfigured.
<#
.SYNOPSIS
    Запрос к 1С:Напарник из интернета.

.DESCRIPTION
    Отправляет вопрос к API 1С:Напарник (модель 1C:Workmate) через
    https://code.1c.ai. Токен берётся из -Token, $env:ONEC_AI_TOKEN,
    ~/.claude/.env, или строки ONEC_AI_TOKEN= в .dev.env текущего проекта.

.PARAMETER Command
    ping — проверить токен (создаёт и закрывает диалог).
    ask  — отправить вопрос (по умолчанию).

.PARAMETER Question
    Текст вопроса (для ask).

.PARAMETER Token
    Токен 1С:Напарник.

.PARAMETER BaseUrl
    Базовый URL API. По умолчанию https://code.1c.ai

.PARAMETER NewSession
    Принудительно создать новый диалог (не переиспользовать предыдущий).

.PARAMETER ConversationId
    Использовать конкретный UUID диалога (игнорирует сохранённую сессию).

.EXAMPLE
    .\Naparnik.ps1 ping
    .\Naparnik.ps1 ask "Как найти дубли в справочнике?"
    .\Naparnik.ps1 ask "Напиши функцию суммы" -NewSession
    .\Naparnik.ps1 ask -QuestionFile "C:\tmp\mr_diff.txt" -NewSession -SkillName review
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("ping", "ask")]
    [string]$Command = "ask",

    [Parameter(Mandatory=$false)]
    [string]$Question,

    [Parameter(Mandatory=$false)]
    [string]$Token,

    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://code.1c.ai",

    [Parameter(Mandatory=$false)]
    [switch]$NewSession,

    [Parameter(Mandatory=$false)]
    [string]$ConversationId,

    [Parameter(Mandatory=$false)]
    [string]$QuestionFile,

    [Parameter(Mandatory=$false)]
    [string]$SkillName = "raw",

    [Parameter(Mandatory=$false)]
    [string]$ToolName = "custom"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$SessionStateFile = Join-Path $env:TEMP "naparnik_session.json"

# ---------------------------------------------------------------------------
# Token resolution: -Token -> $env:ONEC_AI_TOKEN -> ~/.claude/.env -> ./.dev.env
# ---------------------------------------------------------------------------
if ([string]::IsNullOrWhiteSpace($Token)) { $Token = $env:ONEC_AI_TOKEN }
if ([string]::IsNullOrWhiteSpace($Token)) {
    $globalEnv = Join-Path $env:USERPROFILE ".claude\.env"
    if (Test-Path -LiteralPath $globalEnv) {
        $line = Get-Content -LiteralPath $globalEnv | Where-Object { $_ -match '^\s*ONEC_AI_TOKEN\s*=' } | Select-Object -First 1
        if ($line) { $Token = (($line -split '=', 2)[1]).Trim().Trim('"') }
    }
}
if ([string]::IsNullOrWhiteSpace($Token)) {
    # Fallback: .dev.env in the current working directory (a 1c-rules project checkout)
    $candidate = Join-Path (Get-Location) ".dev.env"
    if (Test-Path -LiteralPath $candidate) {
        $line = Get-Content -LiteralPath $candidate | Where-Object { $_ -match '^\s*ONEC_AI_TOKEN\s*=' } | Select-Object -First 1
        if ($line) { $Token = (($line -split '=', 2)[1]).Trim().Trim('"') }
    }
}
if ([string]::IsNullOrWhiteSpace($Token)) {
    Write-Output "ERR: токен не найден. Задайте -Token, переменную окружения ONEC_AI_TOKEN, строку ONEC_AI_TOKEN= в ~/.claude/.env, либо в .dev.env текущего проекта"
    exit 2
}

$BaseUrl = $BaseUrl.TrimEnd('/')

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function New-ApiHeaders {
    param([string]$Accept = "*/*")
    return @{
        "Authorization"   = $Token
        "Accept"          = $Accept
        "Accept-Language" = "ru-ru,en-us;q=0.8,en;q=0.7"
        "Origin"          = $BaseUrl
        "Referer"         = "$BaseUrl/chat/"
    }
}

function New-Conversation {
    $body = @{
        tool_name       = $ToolName
        skill_name      = $SkillName
        ui_language     = "russian"
        is_chat         = $true
        script_language = "ru"
    } | ConvertTo-Json

    $r = Invoke-WebRequest -Uri "$BaseUrl/chat_api/v1/conversations/" -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Headers (New-ApiHeaders) -Body $body -TimeoutSec 30 -UseBasicParsing

    if ($r.StatusCode -ne 200) { throw "Ошибка создания диалога: HTTP $($r.StatusCode) — $($r.Content)" }
    $data = $r.Content | ConvertFrom-Json
    if (-not $data.uuid) { throw "Ответ API не содержит uuid: $($r.Content)" }
    return [string]$data.uuid
}

function Send-Message {
    param([string]$ConvId, [string]$Text)

    $body = @{
        parent_uuid = $null
        role        = "user"
        content     = @{ content = @{ instruction = $Text } }
    } | ConvertTo-Json -Depth 6

    $r = Invoke-WebRequest -Uri "$BaseUrl/chat_api/v1/conversations/$ConvId/messages" -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Headers (New-ApiHeaders -Accept "text/event-stream") `
        -Body $body -TimeoutSec 180 -UseBasicParsing

    if ($r.StatusCode -ne 200) { throw "Ошибка отправки сообщения: HTTP $($r.StatusCode) — $($r.Content)" }
    return $r.Content
}

function ConvertFrom-Sse {
    param([string]$SseText)

    $result = [ordered]@{ text = ""; toolCalls = $null; assistantUuid = $null }
    $accumulated = ""
    $hasFinalContent = $false

    foreach ($line in ($SseText -split "`r?`n")) {
        $line = $line.TrimEnd("`r")
        if (-not $line.StartsWith("data: ")) { continue }
        $dataStr = $line.Substring(6)
        if ($dataStr.Trim() -eq "[DONE]") { break }
        try { $data = $dataStr | ConvertFrom-Json } catch { continue }
        if (-not $data) { continue }

        if ($data.role -eq "assistant" -and $data.uuid) { $result.assistantUuid = [string]$data.uuid }

        $content = $data.content
        if ($content) {
            if ($content.tool_calls) { $result.toolCalls = $content.tool_calls }
            if ($content.text) { $result.text = [string]$content.text; $hasFinalContent = $true }
            elseif ($content.content) { $result.text = [string]$content.content; $hasFinalContent = $true }
        }
        $delta = $data.content_delta
        if ($delta) {
            if ($delta -is [string]) { $accumulated += $delta }
            elseif ($delta.content) { $accumulated += [string]$delta.content }
            if ($delta.tool_calls) { $result.toolCalls = $delta.tool_calls }
        }
    }

    if (-not $hasFinalContent -and -not [string]::IsNullOrWhiteSpace($accumulated)) { $result.text = $accumulated }

    $result.text = [regex]::Replace($result.text, '<think(?:ing)?>.*?</think(?:ing)?>', '', 'Singleline')
    $result.text = $result.text.Trim()
    return $result
}

function Send-AgentLoop {
    param([string]$ConvId, [string]$Text, [int]$MaxSteps = 8)

    $body = @{
        parent_uuid = $null
        role        = "user"
        content     = @{ content = @{ instruction = $Text } }
    } | ConvertTo-Json -Depth 6

    $r = Invoke-WebRequest -Uri "$BaseUrl/chat_api/v1/conversations/$ConvId/messages" -Method Post `
        -ContentType "application/json; charset=utf-8" `
        -Headers (New-ApiHeaders -Accept "text/event-stream") `
        -Body $body -TimeoutSec 300 -UseBasicParsing

    if ($r.StatusCode -ne 200) { throw "Ошибка отправки сообщения: HTTP $($r.StatusCode) — $($r.Content)" }

    $parsed = ConvertFrom-Sse -SseText $r.Content
    $step = 0
    while ($parsed.toolCalls -and $step -lt $MaxSteps) {
        $step++
        Write-Verbose "Agent step $($step): $($parsed.toolCalls.Count) tool_calls"
        foreach ($tc in @($parsed.toolCalls)) {
            $callId = $tc.id
            Write-Verbose "  tool=$($tc.function.name) id=$callId"
            if (-not $callId) { continue }
            $ack = @{
                parent_uuid = $parsed.assistantUuid
                role        = "tool"
                content     = @(@{ tool_call_id = [string]$callId; status = "accepted"; content = $null })
            } | ConvertTo-Json -Depth 6

            $r2 = Invoke-WebRequest -Uri "$BaseUrl/chat_api/v1/conversations/$ConvId/messages" -Method Post `
                -ContentType "application/json; charset=utf-8" `
                -Headers (New-ApiHeaders -Accept "text/event-stream") `
                -Body $ack -TimeoutSec 300 -UseBasicParsing

            if ($r2.StatusCode -ne 200) { throw "Ошибка ACK tool_call: HTTP $($r2.StatusCode) — $($r2.Content)" }
            $parsed = ConvertFrom-Sse -SseText $r2.Content
        }
    }

    return $parsed
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if ($Command -eq "ping") {
    try {
        $conv = New-Conversation
        Write-Output "OK: токен валиден. Диалог создан: $conv"
    } catch {
        Write-Output "ERR: $($_.Exception.Message)"
        exit 1
    }
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Question) -and [string]::IsNullOrWhiteSpace($QuestionFile)) {
    Write-Output "ERR: укажите вопрос через -Question или файл через -QuestionFile"
    exit 2
}
if ([string]::IsNullOrWhiteSpace($Question) -and -not [string]::IsNullOrWhiteSpace($QuestionFile)) {
    if (-not (Test-Path -LiteralPath $QuestionFile)) {
        Write-Output "ERR: файл вопроса не найден: $QuestionFile"
        exit 2
    }
    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $QuestionFile))
    $Question = [System.Text.Encoding]::UTF8.GetString($bytes).TrimStart([char]0xFEFF)
    if ([string]::IsNullOrWhiteSpace($Question)) {
        Write-Output "ERR: файл вопроса пуст"
        exit 2
    }
}

try {
    $convId = $null
    if (-not [string]::IsNullOrWhiteSpace($ConversationId)) {
        $convId = $ConversationId
    } elseif (-not $NewSession -and (Test-Path -LiteralPath $SessionStateFile)) {
        try {
            $saved = Get-Content -LiteralPath $SessionStateFile -Raw | ConvertFrom-Json
            if ($saved.conversation_id) { $convId = [string]$saved.conversation_id }
        } catch { $convId = $null }
    }
    if (-not $convId) { $convId = New-Conversation }

    if ($SkillName -eq "review" -or $SkillName -eq "custom" -or $SkillName -eq "explain" -or $SkillName -eq "modify") {
        $parsed = Send-AgentLoop -ConvId $convId -Text $Question
    } else {
        $sse = Send-Message -ConvId $convId -Text $Question
        $parsed = ConvertFrom-Sse -SseText $sse
    }
    $answer = $parsed.text

    @{ conversation_id = $convId } | ConvertTo-Json | Set-Content -LiteralPath $SessionStateFile -Encoding UTF8

    if ([string]::IsNullOrWhiteSpace($answer)) {
        Write-Output "ERR: API не вернул текстовый ответ (возможно, tool_calls). Перезапустите с -NewSession (skill_name=raw)."
        exit 3
    }

    Write-Output $answer
} catch {
    Write-Output "ERR: $($_.Exception.Message)"
    exit 1
}
