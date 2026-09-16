# Настройка 1С OData MCP-сервера

## Быстрый старт

1. **Node.js** — уже есть портативная версия в `tools/nodejs/node-v24.19.0-win-x64/node.exe`
2. **Конфиг** — заполни `.env` (или переменные в opencode.jsonc)
3. **Запуск** — opencode подключает сервер автоматически через `mcpServers`

---

## Портативный Node.js

Путь: `tools/nodejs/node-v24.19.0-win-x64/node.exe`

Версия: 24.19.0 (LTS), win-x64.

Никаких установок не требуется — агент запускает сервер напрямую через этот бинарник.

Проверка:
```powershell
& "tools/nodejs/node-v24.19.0-win-x64/node.exe" --version
# v24.19.0
```

---

## Подключение OData в 1С

### Что нужно для работы

1. 1С:Предприятие 8.3.5+ с опубликованным OData
2. Веб-сервер (IIS/Apache) с компонентой "Модули расширения веб-сервера"
3. Пользователь 1С с логином/паролем

### Настройка OData (один раз)

1. Открой базу в **Конфигураторе** → **Администрирование → Публикация на веб-сервере…**
2. Укажи имя публикации (латиницей), выбери веб-сервер → **Опубликовать**
3. В том же диалоге поставь галочку **"Публиковать стандартный интерфейс OData"**
4. В режиме **Предприятие**: **Все функции → Обработки → Настройка стандартного интерфейса OData**
5. Вкладка **"Состав"** → добавь нужные объекты → **Записать/Сохранить**

### Минимальный состав для Бухгалтерии 3.0

| Категория | Объекты |
|-----------|---------|
| Справочники | Контрагенты, Номенклатура, Организации, ДоговорыКонтрагентов, Склады, БанковскиеСчета |
| Документы | РеализацияТоваровУслуг, СчётНаОплатуПокупателю, ПоступлениеТоваровУслуг, ПлатёжноеПоручение |
| Планы счетов | Хозрасчётный |
| Регистры | Хозрасчётный |

### Проверка OData

Открой в браузере:
```
http://<сервер>/<имя_публикации>/odata/standard.odata/?$format=json
```

- JSON со списком объектов → OData работает
- `"value": []` → Состав пуст (Шаг 3)
- 404 → OData не включён или неверный адрес
- 401 → Неверная учётка

---

## ⚠️ 1С:Фреш — разделённый и неразделённый режим (КРИТИЧНО)

> Это самая частая причина ошибок. Прочитай до подключения.

На 1С:Фреш (1cfresh) база может работать в двух режимах:

| Режим | Что отдаёт OData | Пример URL |
|---|---|---|
| **Неразделённый** | **ТОЛЬКО метаданные**. Запросы к справочникам (`Catalog_Сотрудники`, `Catalog_Организации`…) → **500** | `https://host/infobase/main_bub/ru_RU/` |
| **Разделённый** (split, область) | **Данные**. Работают запросы к справочникам | `https://host/infobase/main_int/281/ru_RU/` |

Как отличить: в URL разделённого режима есть **номер области** (`/281/`), а имя базы оканчивается на `_int` (а не `_bub`).

OData-адрес строится из веб-ссылки заменой `/ru_RU/` на `/odata/standard.odata/`:
- Неразделённый: `.../main_bub/odata/standard.odata/`
- Разделённый: `.../main_int/281/odata/standard.odata/`

### Пользователи OData на Фреше

- Пользователь для **веб-входа** в область (напр. `OData281`) **НЕ** имеет автоматически доступа к OData → на OData будет **401**.
- Нужен пользователь, заведённый **внутри области** в обработке **«Настройка стандартного интерфейса OData»** (Администрирование → Настройка стандартного интерфейса OData).
- Рабочий пример: логин `OData.user` (область 281 «Карелия»; пароль хранится в окружении — opencode.jsonc / .env.local, в документации не указывается).

### Чек-лист для Фреш

1. Возьми у пользователя **веб-ссылку** на область (с номером области) — не на неразделённую базу.
2. Построй OData-URL: замени `/ru_RU/` на `/odata/standard.odata/`.
3. Убедись, что пользователь заведён в «Настройке стандартного интерфейса OData» области.
4. Проверь метаданные: `.../odata/standard.odata/?$format=json` → 200 OK.
5. Проверь справочник: `.../odata/standard.odata/Catalog_Организации?$top=10&$format=json` → 200 OK = данные доступны.

---

## Настройка MCP-сервера

### Вариант 1: Через opencode.jsonc (рекомендуется)

Файл: `~/.config/opencode/opencode.jsonc`

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcpServers": {
    "1c-odata": {
      "command": "D:\\<project>\\AI_Agent\\OData\\tools\\nodejs\\node-v24.19.0-win-x64\\node.exe",
      "args": ["D:\\<project>\\AI_Agent\\OData\\dist\\index.js"],
      "env": {
        "ODATA_BASE_URL": "http://<сервер>/<база>/odata/standard.odata/",
        "ODATA_USERNAME": "login",
        "ODATA_PASSWORD": "password",
        "ODATA_DB_NAME": "buh",
        "ODATA_DB_LABEL": "Бухгалтерия",
        "READ_ONLY": "true"
      }
    }
  }
}
```

### Вариант 2: Через .env-файл

Скопируй `.env.example` → `.env` и заполни:

```env
ODATA_BASE_URL=http://<сервер>/<база>/odata/standard.odata/
ODATA_USERNAME=login
ODATA_PASSWORD=password
ODATA_DB_NAME=buh
ODATA_DB_LABEL=Бухгалтерия ООО "Ромашка"

# Настройки клиента
ODATA_TIMEOUT_MS=30000
ODATA_RETRIES=3
ODATA_PAGE_SIZE=100
ODATA_MAX_ROWS=1000

# Режим записи (по умолчанию true = только чтение)
READ_ONLY=true
```

В opencode.jsonc укажи:
```jsonc
{
  "mcpServers": {
    "1c-odata": {
      "command": "D:\\<project>\\AI_Agent\\OData\\tools\\nodejs\\node-v24.19.0-win-x64\\node.exe",
      "args": ["--env-file", "D:\\<project>\\AI_Agent\\OData\\.env", "D:\\<project>\\AI_Agent\\OData\\dist\\index.js"]
    }
  }
}
```

### Несколько баз 1С

Раскомментируй блок Б в `.env.example`:

```env
# Одна база (закомментировать блок А)
ODATA_BASE_URL=...
ODATA_USERNAME=...
ODATA_PASSWORD=...

# Или несколько баз
ODATA_DB_BUH_BASE_URL=http://server/buh/odata/standard.odata/
ODATA_DB_BUH_USERNAME=login1
ODATA_DB_BUH_PASSWORD=pass1
ODATA_DB_BUH_LABEL=Бухгалтерия

ODATA_DB_TORG_BASE_URL=http://server/torg/odata/standard.odata/
ODATA_DB_TORG_USERNAME=login2
ODATA_DB_TORG_PASSWORD=pass2
ODATA_DB_TORG_LABEL=Торговля

# База по умолчанию (если не указан database=)
ODATA_DEFAULT_DB=buh
```

В opencode.jsonc передай env без ключевых переменных — сервер их не ждёт при множественных базах.

### Включение записи (опционально)

```env
READ_ONLY=false               # Глобальный рубильник
ODATA_DB_BUH_WRITABLE=true    # На конкретную базу
```

---

## Подключение новой базы

1. Проверь OData по инструкции выше (Шаги 1–3)
2. Получи: адрес OData, логин, пароль
3. Обнови `.env` или opencode.jsonc:
   - Одна база → перезапиши ODATA_BASE_URL / USERNAME / PASSWORD
   - Несколько баз → добавь `ODATA_DB_NEWNAME_*`
4. Перезапусти opencode (`/reload`)
5. Проверь: "покажи список баз" → `read.system.list_databases`

---

## Диагностика ошибок

| Симптом | Причина | Решение |
|---------|---------|---------|
| 401 Unauthorized | Неверная учётка / пользователь не заведён для OData | Проверить логин/пароль 1С; на Фреше завести пользователя в «Настройке стандартного интерфейса OData» области |
| 404 | Неверный путь OData | Проверить `/odata/standard.odata/` в URL |
| 500 на запросы к справочникам | Неразделённый режим 1С:Фреш — данные не отдаются | Нужна ссылка на область (разделённый режим, номер в URL) |
| 501 на `$count=true` | 1С не поддерживает `$count` | Использовать `$top` вместо `$count` |
| "Сущность не найдена" | Объект не в Составе OData | Добавить в Настройку стандартного интерфейса OData |
| Пустой список объектов | Состав пуст | Добавить объекты и сохранить |
| Инструменты не появились | Не перезапустил клиент | Полный перезапуск opencode |
| Таймаут | База медленно отвечает | Увеличить ODATA_TIMEOUT_MS |
| `Cannot find module` | Не собран dist | `npm run build` |
| `node`/`npx` не найдены | Их нет в PATH | Всегда использовать полный путь: `tools/nodejs/node-v24.19.0-win-x64/node.exe` |

---

## Проверка работы

После запуска opencode попроси:
- "проверь соединение с 1С" → `read.system.health_check`
- "покажи дебиторку" → `read.analytics.get_debtors`
- "список контрагентов" → `read.system.list_objects`

---

## Рабочие подключения (проверено 2026-09-10)

### Область №281 «Карелия» — разделённый режим, данные доступны ✅

- OData: `https://host.example.com/infobase/main_int/281/odata/standard.odata/`
- Логин: `OData.user` / Пароль: в окружении (opencode.jsonc / .env.local)
- Статус: 200 OK, 97 организаций в `Catalog_Организации`
- Конфиг opencode.jsonc и `.env.local` настроены на эту область

### Неразделённый режим — только метаданные ⚠️

- OData: `https://host.example.com/infobase/main_bub/odata/standard.odata/`
- Логин: `OData` / Пароль: в окружении (opencode.jsonc / .env.local)
- Метаданных: 6121 сущность. Данные справочников — НЕ доступны (500)

---

## Полезные ссылки

- Полная инструкция: [docs/ODATA-SETUP.md](docs/ODATA-SETUP.md)
- Подключение и диагностика: [docs/CONNECTING.md](docs/CONNECTING.md)
- Документация пакета: [README.md](README.md)
