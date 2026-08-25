# OneScript (oscript)

- **Репозиторий:** [EvilBeaver/OneScript](https://github.com/evilbeaver/onescript) — "Исполняющая среда скриптов на языке 1С".
- **Что это:** независимая от платформы 1С исполняющая среда для языка, синтаксически повторяющего встроенный язык 1С:Предприятия — headless, кроссплатформенная (.NET/Mono), без нужды в полном сервере 1С.
- **Роль в экосистеме:** рантайм, на котором держится весь стек автоматизации — сам vanessa-runner написан на OneScript.

## Пакетный менеджер и версионирование

- **opm** — [oscript-library/opm](https://github.com/oscript-library/opm), пакетный менеджер OneScript. Пакеты хранятся на `hub.oscript.io` (основной) и `hub.oscript.ru` (резервный, если основной недоступен).
- **ovm** — [oscript-library/ovm](https://github.com/oscript-library/ovm), OneScript Version Manager — переключение между версиями OneScript, аналог nvm/pyenv для этой экосистемы.
- **oscript-library** — [организация на GitHub](https://github.com/oscript-library), 209 репозиториев — библиотека пакетов сообщества.

## Практическое значение для целей (тесты + код)

OneScript — это то, что позволяет **гонять тесты и линтеры в CI без реального сервера 1С:Предприятия и без Windows-специфичных COM-зависимостей** (кроссплатформенность). Прямо пересекается с открытым вопросом переноса GitLab-раннера Windows→Linux (см. `1c-runner-migration/PLAN.md`, Шаг 0) — если сборочный/тестовый шаг реально идёт через OneScript+vanessa-runner (а не через `1cv8.exe`/COM), перенос на Linux технически прямой.

## Источники

- [EvilBeaver/OneScript](https://github.com/evilbeaver/onescript)
- [oscript-library/opm](https://github.com/oscript-library/opm)
- [oscript-library/ovm](https://github.com/oscript-library/ovm)
- [oscript-library org](https://github.com/oscript-library)
- [OneScript docs (gitflic)](https://docs.gitflic.ru/latest/en/registry/onescript/)
