# AskNaparnik — прямой вопрос к 1С:Напарник

Прямой доступ к API 1С:Напарник (`https://code.1c.ai`), минуя локальный MCP-сервер
`onec-code-check-mcp`. Используй, когда локальный сервер недоступен или не настроен.

## Команды

```powershell
$N = "<путь до skills>/Naparnik/Tools/Naparnik.ps1"
powershell.exe -NoProfile -File $N ping                                   # проверить токен
powershell.exe -NoProfile -File $N ask "Как найти дубли в справочнике?"    # вопрос
powershell.exe -NoProfile -File $N ask "Напиши функцию суммы" -NewSession  # новый диалог
powershell.exe -NoProfile -File $N ask -QuestionFile "C:\tmp\q.txt" -NewSession -SkillName review -Verbose
```

## Параметры

| Параметр | Описание |
|----------|----------|
| `-Command` | `ping` — проверка токена; `ask` — вопрос (по умолчанию) |
| `-Question` / `-QuestionFile` | Текст вопроса, или путь к файлу с вопросом (UTF-8) — удобно для больших диффов/модулей |
| `-Token` | Токен Напарника. Резолвится: `-Token` → `$env:ONEC_AI_TOKEN` → `ONEC_AI_TOKEN=` в `~/.claude/.env` → `.dev.env` в текущей директории |
| `-NewSession` | Новый диалог. Без флага переиспользуется последняя сессия (история сохраняется между вызовами через `%TEMP%\naparnik_session.json`) |
| `-SkillName` | `raw` (по умолчанию, прямой ответ) · `review` (агентное ревью с категориями критичности) · `explain` · `modify` · `custom` |

## Токен

Выдаётся на `https://code.1c.ai/tokens/` (авторизация через 1С:ИТС). Хранить как
`ONEC_AI_TOKEN=<токен>` в `~/.claude/.env` — скрипт найдёт его сам.

## Режимы (`-SkillName`)

`review` — агентный режим: Напарник сам вызывает инструменты (проверку синтаксиса,
поиск документации), затем выдаёт структурированный ответ с категориями
критичности («Высокая/Средняя/Низкая», «Ошибка/Предупреждение/Замечание»).
Для фильтрации «только важное» — сформулируй это прямо в вопросе:

```
Проверь код. Перечисли ТОЛЬКО критичные ошибки и явные баги.
Игнорируй стилистику, именование и незначительные замечания.
```

Агентные режимы (`review`/`custom`/`explain`/`modify`) сами обрабатывают цепочку
`tool_calls` — скрипт подтверждает каждый вызов и повторяет до финального ответа
(до 8 шагов).

## Как это работает

1. `POST /chat_api/v1/conversations/` с `{"tool_name","skill_name","ui_language":"russian","is_chat":true,"script_language":"ru"}` → `{"uuid": "..."}`.
2. `POST /chat_api/v1/conversations/<uuid>/messages` с `{"parent_uuid","role":"user","content":{"content":{"instruction":"..."}}}` и `Accept: text/event-stream` → SSE-поток, текст в `content.content` / `content_delta.content`.

Заголовки: `Authorization: <токен без Bearer>`, `Origin`/`Referer: https://code.1c.ai`.
