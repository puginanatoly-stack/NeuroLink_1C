# vanessa-runner (vrunner)

- **Репозиторий:** [vanessa-opensource/vanessa-runner](https://github.com/vanessa-opensource/vanessa-runner)
- **Что это:** CLI-утилита автоматизации базовых операций разработчика 1С — устанавливается через пакетный менеджер OneScript (`opm`), сама написана на OneScript.
- **Роль:** фактический "дирижёр" для CI — поднимает/обновляет инфобазу, гоняет Vanessa Automation/Vanessa-ADD/YAxUnit тесты, отдаёт отчёты в xUnit/JUnit-совместимом формате для GitLab CI.

## Установка

```bash
opm install vanessa-runner          # последняя стабильная (3.x)
opm install vanessa-runner@2.6.1    # LTS-ветка 2.x, только багфиксы — рекомендована для продакшн-CI
opm install vanessa-runner@SNAPSHOT # для тестирования новых фич
```

## ⚠ Гочка: breaking changes в 3.0 — синтаксис команд разный между 2.x и 3.x

| Действие | vrunner 2.x | vrunner 3.0 |
|---|---|---|
| Запуск BDD-тестов | `vrunner vanessa` | `vrunner test vanessa` |
| Обновление инфобазы | `vrunner updatedb` | `vrunner infobase update` |
| Синтаксис-проверка | — | `vrunner validate syntax-check` |

Если в существующем CI-пайплайне (или в чужом примере/документации) встречается `vrunner vanessa`/`vrunner updatedb` — это 2.x-синтаксис, на 3.x он не сработает без миграции. Перед копированием любого примера команды — сверить, под какую мажорную версию он написан.

## Конфигурация

- Через переменные окружения с префиксом `VRUNNER_*`
- Через `autumn-properties.json` — иерархический JSON с секциями под тест-раннер, формат отчётов (xUnit), параметры подключения (`ibconnection`, `v8version`)

## Источники

- [vanessa-opensource/vanessa-runner](https://github.com/vanessa-opensource/vanessa-runner)
- [vanessa-runner README (develop)](https://github.com/vanessa-opensource/vanessa-runner/blob/develop/README.md)
- [hub.oscript.io package listing](https://hub.oscript.io/package/vanessa-runner)
