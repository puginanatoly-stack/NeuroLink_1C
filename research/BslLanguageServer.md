# BSL Language Server

- **Репозиторий:** [1c-syntax/bsl-language-server](https://github.com/1c-syntax/bsl-language-server)
- **Что это:** реализация Language Server Protocol для языка 1С (BSL) и OneScript (.os). Диагностика, навигация, форматирование, автодополнение, параметр-хинты, type hierarchy — LSP до версии 3.18.
- **Конфигурация:** через `.bsl-language-server.json` в корне проекта — см. [ConfigurationFile docs](https://github.com/1c-syntax/bsl-language-server/blob/develop/docs/en/features/ConfigurationFile.md).

## MCP-режим — прямое попадание в задачу

BSL Language Server умеет работать **как MCP-сервер напрямую**, без обёрток — открывает возможности анализа кода 1С (BSL)/OneScript для AI-агентов. MCP-инструменты: `analyze_file`, `document_symbols`, `find_references`, `call_hierarchy`, `hover`, `definition`, `type_info`.

## claude-code-bsl-lsp — готовый плагин для Claude Code

- **Репозиторий:** [1c-syntax/claude-code-bsl-lsp](https://github.com/1c-syntax/claude-code-bsl-lsp)
- **Установка:**
  ```
  claude /plugin marketplace add 1c-syntax/claude-code-bsl-lsp
  claude /plugin install bsl-language-server@bsl-language-server
  ```
  (или локально: `git clone` + `claude /plugin marketplace add /path/to/claude-code-bsl-lsp`)
- **Авто-установка:** плагин сам проверяет наличие бинарника BSL Language Server, скачивает нужную версию под ОС, чистит старые версии. Java не требуется — нативный бинарник.
- **Windows:** работает через Git Bash (по умолчанию) или PowerShell 6+.
- **Поддерживаемые файлы:** `.bsl` (1С:Enterprise) и `.os` (OneScript).
- **Ручной fallback:** если авто-установка не сработала — скачать бинарник с [releases](https://github.com/1c-syntax/bsl-language-server/releases/latest) и положить в PATH.

Это самый простой путь получить диагностику/линтинг BSL прямо в Claude Code-сессии — не требует отдельного скилла, устанавливается как обычный плагин.

## Источники

- [1c-syntax/bsl-language-server](https://github.com/1c-syntax/bsl-language-server)
- [1c-syntax/claude-code-bsl-lsp](https://github.com/1c-syntax/claude-code-bsl-lsp)
- [ConfigurationFile docs](https://github.com/1c-syntax/bsl-language-server/blob/develop/docs/en/features/ConfigurationFile.md)
- [BSL LS releases](https://github.com/1c-syntax/bsl-language-server/releases)
