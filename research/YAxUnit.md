# YAxUnit

- **Репозиторий:** [bia-technologies/yaxunit](https://github.com/bia-technologies/yaxunit) — "Расширение для запуска тестов".
- **Связанный проект:** [bia-technologies/edt-test-runner](https://github.com/bia-technologies/edt-test-runner) — test runner для EDT, работает поверх движка YAxUnit.
- **Позиционирование:** более простой вариант xUnitFor1C, третий игрок после Vanessa-ADD — заточен конкретно под однородность прогона между Конфигуратором, EDT и CI.

## Архитектура (важно для CI/Linux-вопроса)

Поднимает **автономный сервер 1С** и гоняет тесты в режиме **Предприятия** (не Конфигуратора/Designer). Управляется консольно через **vanessa-runner**. Формирует отчёт в **JUnit XML** — нативный формат для GitLab CI.

Концептуально значимо: режим Предприятия у платформы 1С имеет Linux-сборку сервера — если связка YAxUnit (автономный сервер) + vanessa-runner реально работает на Linux, это одновременно закрывает и unit-тестирование, и подкрепляет перенос GitLab-раннера на Linux (см. `1c-runner-migration/PLAN.md`). **Не подтверждено напрямую** — требует технической проверки, не просто веб-поиска.

## bia-technologies и связь с найденными форками vanessa-automation

При разборе форков `Pr-Mex/vanessa-automation` (см. `VanessaAutomation.md`) один из немногих активных — `bia-technologies/vanessa-automation` (та же организация, что делает YAxUnit) — логично: они строят инструментарий в этой же экосистеме, поэтому держат синхронизированный форк основного BDD-репозитория.

## Vanessa-ADD vs YAxUnit — открытый выбор

Из связанного рабочего исследования (`1c-release-testing-strategy/ANALYSIS.md`, 2026-08-05): если BDD-суита уже на Vanessa Automation, **Vanessa-ADD** даёт наименьшее трение (одна экосистема). **YAxUnit** — сильный кандидат №2, особенно если подтвердится Linux-совместимость связки (сервер + vrunner) — тогда одно решение закрывает сразу и unit-тестирование, и раннер-миграцию. Финальный выбор требует технической проверки на реальном стенде, не решается только сравнением документации.

## Источники

- [bia-technologies/yaxunit](https://github.com/bia-technologies/yaxunit)
- [bia-technologies/edt-test-runner](https://github.com/bia-technologies/edt-test-runner)
- [YAxUnit docs](https://bia-technologies.github.io/yaxunit/)
- [infostart.ru: YAxUnit или модульное тестирование в 1С](https://infostart.ru/1c/articles/1976659/)
