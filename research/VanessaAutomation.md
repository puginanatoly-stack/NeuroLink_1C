# Vanessa Automation + Vanessa-ADD

## Vanessa Automation

- **Репозиторий:** [Pr-Mex/vanessa-automation](https://github.com/Pr-Mex/vanessa-automation) — 681★, 237 форков, 12 731 коммитов на `develop`, лицензия BSD v3.
- **Что это:** BDD-фреймворк для 1С:Enterprise, сценарии на Gherkin.
- **Активность:** последний push — неделю назад (на момент исследования), 210 открытых issues, 21 PR — живой проект.
- **Документация:** [pr-mex.github.io/vanessa-automation/dev](https://pr-mex.github.io/vanessa-automation/dev/)
- **Запуск из командной строки:** параметры передаются через `VAParams.json` — см. [JsonParams reference](https://pr-mex.github.io/vanessa-automation/dev/JsonParams/JsonParamsEN/).

### Форки — итог исследования

Прогнано 237 форков через GitHub compare API против `develop`. Подавляющее большинство — зеркала (ahead=0), включая недавно запушенные (форкают ради PR в апстрим, не ради параллельной ветки). Единственное исключение с собственными ветками — [lintest/vanessa-automation](https://github.com/lintest/vanessa-automation) (13 веток: addin/decorator/driver/refactoring/vaeditor/multilang), но все сильно устарели (4600+ коммитов позади) — исторический референс идей, не актуальный код.

## Vanessa-ADD

- **Репозиторий:** [vanessa-opensource/add](https://github.com/vanessa-opensource/add) — "Разработка с управляемым качеством на 1С".
- **Роль:** официальный, активно поддерживаемый преемник **и** xUnitFor1C, **и** Vanessa-Behavior (последний коммит 2024-12-20 на момент проверки в связанном рабочем исследовании).
- **Совместимость:** с Vanessa-Behavior 1.X и xUnitFor1C 4.X (кроме циклов/условий).
- **Когда выбирать:** если BDD-суита уже на Vanessa Automation — Vanessa-ADD для unit-уровня даёт наименьшее трение (одна экосистема, один runner).

## xUnitFor1C (для контекста, не рекомендуется)

- **Репозиторий:** [xDrivenDevelopment/xUnitFor1C](https://github.com/xDrivenDevelopment/xUnitFor1C)
- **Статус: мёртв** — последний коммит 2018-03-31. Родоначальник направления, но не для нового внедрения — Vanessa-ADD его прямой активный преемник.

## Источники

- [Pr-Mex/vanessa-automation](https://github.com/Pr-Mex/vanessa-automation)
- [vanessa-opensource/add](https://github.com/vanessa-opensource/add)
- [xDrivenDevelopment/xUnitFor1C](https://github.com/xDrivenDevelopment/xUnitFor1C)
- [Vanessa Automation docs](https://pr-mex.github.io/vanessa-automation/dev/)
