# MCP-серверы для экосистемы 1С

Каталог собран из [Untru/1c-mcp](https://github.com/Untru/1c-mcp) (45 находок на момент проверки) + прямого поиска. Ниже — сначала топ-рекомендации под конкретную цель (тестирование баз + написание кода), затем полный каталог для справки. Качество/зрелость большинства записей **не верифицирована** — многие ранне-стадийные, инструмент от одного автора, коммерческие или явно нишевые; не устанавливать вслепую, проверять активность репозитория перед использованием.

## Топ-рекомендации под цель "тестировать базы + писать код"

| Сервер | Зачем | Статус |
|---|---|---|
| **[1c-syntax/claude-code-bsl-lsp](https://github.com/1c-syntax/claude-code-bsl-lsp)** | Готовый Claude Code плагин — LSP-диагностика BSL/.os прямо в сессии, auto-install бинарника. Устанавливается в 2 команды, не MCP-конфиг вручную. | Готов к установке — см. `BslLanguageServer.md` |
| **[alkoleft/mcp-onec-test-runner](https://github.com/alkoleft/mcp-onec-test-runner)** | Запуск YaXUnit-тестов и сборка 1С-проекта прямо из AI-агента — закрывает "тестировать базы" напрямую | Проверить активность репозитория перед установкой |
| **[alkoleft/v8-runner-rust](https://github.com/alkoleft/v8-runner-rust)** | Rust CLI/MCP для локального цикла разработки — сборки, проверки, запуск тестов | Проверить активность |
| **[alkoleft/mcp-bsl-platform-context](https://github.com/alkoleft/mcp-bsl-platform-context)** | Интерактивный синтаксис-справочник платформы с fuzzy search — снижает галлюцинации по несуществующим методам при написании кода | Проверить активность |
| **[DitriXNew/EDT-MCP](https://github.com/DitriXNew/EDT-MCP)** | MCP как плагин 1C:EDT — BSL-анализ + скриншоты форм. Релевантно, если пишешь именно в EDT | Проверить активность |
| **[feenlace/mcp-1c](https://github.com/feenlace/mcp-1c)** | Один Go-бинарник, подключается к живой базе 1С — метаданные + поиск по коду | Проверить активность |

Тот же автор (`alkoleft`) стоит за тремя из шести топ-кандидатов (`mcp-onec-test-runner`, `v8-runner-rust`, `mcp-bsl-platform-context`, плюс `bsl-graph`) — похоже на цельную, сознательно построенную линейку инструментов под именно эту задачу (build+test+context для AI-агентов над 1С), не случайный набор.

## Полный каталог (45 находок, по категориям)

### IDE-интеграции
- [EDT-MCP](https://github.com/DitriXNew/EDT-MCP) — MCP-плагин для 1C:EDT, BSL-анализ + скриншоты форм
- [CodePilot1C](https://github.com/ondysss/codepilot1c-edt) — AI-плагин для EDT, чат + agent mode + MCP Host
- [1C: Platform Tools MCP](https://github.com/yellow-hammer/mcp-1c-platform-tools) — вызов команд VS Code расширения через MCP
- [onec-client-mcp-devkit](https://github.com/1c-neurofish/onec-client-mcp-devkit/releases) — расширение 1С-клиента для работы MCP (тот же автор/организация, что `v8-session-manager` ниже)

### Фреймворки для создания MCP-серверов
- [1c_mcp](https://github.com/vladimir-kharin/1c_mcp) — фреймворк MCP-серверов внутри 1С:Предприятие через расширения
- [1c-mcp-toolkit](https://github.com/ROCTUP/1c-mcp-toolkit) — встроенный HTTP-сервер в .epf, без изменения конфигурации
- [http1c](https://mcpmarket.com/server/http1c) — нативный фреймворк публикации бизнес-логики 1С как MCP

### Метаданные и анализ кода
- [mcp-1c](https://github.com/feenlace/mcp-1c) — Go-бинарник, метаданные + поиск по коду на живой базе
- [1C_MCP_metadata](https://github.com/artesk/1C_MCP_metadata) — поиск метаданных по имени/синониму/комментарию
- [1c-mcp-metacode](https://github.com/ROCTUP/1c-mcp-metacode) — Neo4j граф метаданных+кода, семантический поиск
- [rlm-tools-bsl](https://github.com/Dach-Coin/rlm-tools-bsl) — RLM-подход под BSL, без обязательного RAG
- [mcp-1c-v1](https://github.com/FSerg/mcp-1c-v1) — Qdrant RAG, семантический поиск по структуре конфигурации
- [1c-templates-mcp](https://yellowmcp.com/servers/1c-templates-mcp) — 2200+ шаблонов кода 1С, поиск

### Платформенная документация/справка
- [mcp-bsl-platform-context](https://github.com/alkoleft/mcp-bsl-platform-context) — интерактивный синтаксис-справочник, fuzzy search
- [onec-help-mcp](https://github.com/rzateev/onec-help-mcp) — гибридный поиск (BM25+семантика) по официальной документации 1С
- [1c-syntax-helper-mcp](https://github.com/Antonio1C/1c-syntax-helper-mcp) — полнотекстовый поиск через Elasticsearch

### Тестирование и синтаксис-проверка
- [mcp-bsl-ls (bsl-mcp)](https://github.com/phsin/mcp-bsl-ls) — анализ и форматирование BSL/.os через BSL LS
- [mcp-bsl-lsp-bridge](https://github.com/SteelMorgan/mcp-bsl-lsp-bridge) — LSP → MCP транслятор, навигация/диагностика/рефакторинг
- [bsl-analyzer](https://github.com/itrous/bsl-analyzer) — высокопроизводительный анализатор BSL на Rust, 180 диагностик, LSP
- [mcp-onec-test-runner](https://github.com/alkoleft/mcp-onec-test-runner) — запуск YaXUnit + сборка проекта из AI-агентов

### 1С:Напарник интеграция
- [1c-buddy](https://github.com/ROCTUP/1c-buddy) — чат + MCP-шлюз к 1С:Напарник, код-ревью и объяснение BSL
- [spring-mcp-1c-copilot](https://github.com/SteelMorgan/spring-mcp-1c-copilot) — Spring Boot MCP-сервер к API 1С:Напарник, SSE
- [1c-ai-mcp](https://github.com/Desko77/1c-ai-mcp) — 12-инструментальный мост к API 1С:Напарник

### Бизнес-системы
- [1c-rest-mcp](https://github.com/theYahia/1c-rest-mcp) — OData/REST операции над справочниками/документами/регистрами
- [ИИкона (1c-ai-connector)](https://github.com/andromanpro/1c-ai-connector) — расширение конфигурации для интеграции LLM, агенты/RAG/мониторинг
- [ARQA MCP Server](https://arqa.cc/ru/mcp-server) — коммерческий on-premise, документы/отчёты через AI
- [1c-accounting-mcp](https://github.com/tarasov46/1c-accounting-mcp) — ранняя стадия, под 1С:Бухгалтерию

### Граф-анализ
- [bsl-graph](https://github.com/alkoleft/bsl-graph) — NebulaGraph-анализатор/визуализатор графа знаний конфигурации 1С

### Инфраструктура/DevOps
- [1c-log-checker](https://github.com/SteelMorgan/1c-log-checker) — парсинг ЖР/ТЖ в ClickHouse, визуализация в Grafana
- [1c-ai-sandbox](https://github.com/SteelMorgan/1c-ai-sandbox-client-server) — Docker-песочница, изолированное окружение 1С для AI-экспериментов
- [v8-runner](https://github.com/alkoleft/v8-runner-rust) — Rust CLI/MCP локального цикла разработки
- [compose4mcp](https://github.com/pravets/compose4mcp) — Docker Compose оркестрация нескольких MCP-серверов под 1С
- [v8-session-manager](https://github.com/1c-neurofish/v8-session-manager) — WebSocket-агрегатор сессий 1С в единый MCP HTTP endpoint
- [OneRPA MCP Suite](https://docs.onerpa.ru/mcp-servery-1c) — набор Docker-контейнеров, платно

### 1C:Element (облачная платформа)
- [elemctl](https://github.com/keyfire/elemctl) — CLI/MCP/библиотека для Element Console API
- [xbsl](https://github.com/keyfire/xbsl) — линтер (161 правило) + LSP + MCP для 1C:Element проектов

### Скиллы и наборы правил (альтернатива/дополнение собственным LifeOS-скиллам)
- [Unica](https://github.com/IngvarConsulting/unica) — плагин для Codex и Claude Code, скиллы по формам/метаданным/операциям 1С
- [ai_rules_1c](https://github.com/comol/ai_rules_1c) — 13 суб-агентов + 8 пакетов скиллов на 11+ AI-инструментов
- [claude-code-skills-1c](https://github.com/Desko77/claude-code-skills-1c) — 117 скиллов + 40 правил для Claude Code
- [cursor-1c-skills](https://github.com/Desko77/cursor-1c-skills) — 116 скиллов + 40 правил для Cursor

### Коммерческие
- [OneMCP](https://onemcp.ru) — SaaS, семантический поиск, командная работа (сейчас бесплатный бета)
- [VibeCoding1C](http://vibecoding1c.ru) — конструктор MCP-серверов + обучающие курсы
- [Infostart MCP](https://infostart.ru) — гибридный поиск, Syntax Assistant, Docker-контейнеры

## Что делать с этим списком

1. **Первый шаг — установить `claude-code-bsl-lsp`.** Готовый плагин, официальный источник (та же организация, что делает сам BSL Language Server), минимальный риск.
2. Прежде чем ставить что-то ещё — проверить дату последнего коммита и число звёзд/issues по каждому кандидату; список собран поиском, не аудитом качества.
3. `claude-code-skills-1c`/`ai_rules_1c`/`Unica` — потенциальная альтернатива части будущих LifeOS-скиллов (VanessaAutomation/OneScriptReference/BslQuality) — стоит проверить, не дублируют ли они то, что здесь строится, прежде чем строить с нуля.

## Источники

- [Untru/1c-mcp — каталог](https://github.com/Untru/1c-mcp)
- [PulseMCP: 1C:Enterprise BSL Language Server MCP Server](https://www.pulsemcp.com/servers/fserg-1c-bsl-language-server)
- [mcpservers.org: mcp-1c](https://mcpservers.org/servers/feenlace/mcp-1c)
- Ссылка на `onec-client-mcp-devkit` обнаружена в докладе Александра Кунташова (канал **ИНФОСТАРТ**) — [«От задачи до работающего автотеста: как создавать и проверять сценарии 1C с помощью AI»](https://youtube.com/watch?v=dpZq08pGSMM), добавлено 2026-09-03.
