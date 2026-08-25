# Vanessa_Code — исследование тестового/AI-инструментария для 1С

> Техническая база знаний по инструментам (не привязана к конкретному рабочему проекту/АСЗУП — та специфика живёт в `1c-release-testing-strategy/` и `1c-runner-migration/`). Собрано 2026-08-25 через веб-поиск, источники указаны в каждом файле.

## Файлы

| Файл | Содержание |
|---|---|
| `VanessaAutomation.md` | Vanessa Automation (BDD) + Vanessa-ADD (unit/xUnit-совместимость) |
| `VanessaRunner.md` | vanessa-runner — CLI-обвязка для CI/автоматизации |
| `OneScript.md` | OneScript (oscript) — headless-среда исполнения, opm/ovm |
| `BslLanguageServer.md` | BSL Language Server — линтер/LSP/MCP для BSL и OneScript |
| `YAxUnit.md` | YAxUnit — альтернатива xUnitFor1C, автономный сервер + vanessa-runner |
| `MCP-Servers.md` | Каталог MCP-серверов под экосистему 1С (45 находок) + топ-рекомендации |

## Как всё связано (карта экосистемы)

```
Написание кода в 1С:EDT
        │
        ├── BSL Language Server ── статический анализ/линтинг BSL и .os
        │         │
        │         └── claude-code-bsl-lsp (готовый Claude Code плагин, авто-установка)
        │
        └── OneScript (oscript) ── headless-исполнение 1С-подобного скрипта
                  │
                  ├── opm/ovm ── пакетный менеджер / версионирование OneScript
                  │
                  └── vanessa-runner ── CLI поверх OneScript, дирижирует:
                            │
                            ├── Vanessa Automation ── BDD-тесты (Gherkin)
                            ├── Vanessa-ADD ── xUnit-совместимые unit-тесты
                            └── YAxUnit ── альтернативный unit-движок (автономный сервер 1С)
```

## Ключевой вывод

Тестирование (BDD/unit) и написание кода — это **два разных инструментальных стека, соединённых через OneScript**. vanessa-runner — фактический "дирижёр" CI-стороны; BSL Language Server — "дирижёр" стороны написания кода. Для полного цикла (пишем → линтим → тестируем на реальной/тестовой базе) нужны оба, плюс OneScript как общий рантайм под ними.
