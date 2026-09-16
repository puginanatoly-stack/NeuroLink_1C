---
name: odata-1c
description: Подключение MCP-сервера 1C OData (1c-odata-mcp) к opencode, настройка портативного Node.js и диагностика проблем с 1С:Фреш (разделённый/неразделённый режим). Использовать когда нужно подключить базу 1С к opencode через OData, разобраться почему OData возвращает 401/404/500, или настроить доступ к данным области Фреш.
---

# Подключение 1С через OData (MCP-сервер)

Проект: `D:\<project>\AI_Agent\OData` — MCP-сервер `1c-odata-mcp` для 1С:Предприятие через стандартный интерфейс OData.

## Быстрый старт

1. **Node.js** — портативная версия: `tools\nodejs\node-v24.19.0-win-x64\node.exe` (v24.19.0, win-x64). Ничего ставить не нужно.
2. **Конфиг** — переменные окружения в `opencode.jsonc` (секция `mcpServers`) или в `.env`-файле.
3. **Запуск** — opencode сам запускает сервер через `mcpServers` из конфига.

## Проверка Node.js

```powershell
& "D:\<project>\AI_Agent\OData\tools\nodejs\node-v24.19.0-win-x64\node.exe" --version
# v24.19.0
```

⚠️ `node`/`npx` НЕ в PATH на этой машине — всегда используй полный путь к портативному node.exe. Никогда не пиши просто `node` или `npx` в командах и конфигах.

## Как выглядит рабочий конфиг (opencode.jsonc)

Файл: `C:\Users\<username>\.config\opencode\opencode.jsonc`

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcpServers": {
    "1c-odata": {
      "command": "D:\\<project>\\AI_Agent\\OData\\tools\\nodejs\\node-v24.19.0-win-x64\\node.exe",
      "args": ["D:\\<project>\\AI_Agent\\OData\\dist\\index.js"],
      "env": {
        "ODATA_BASE_URL": "https://<host>/<путь>/odata/standard.odata/",
        "ODATA_USERNAME": "логин",
        "ODATA_PASSWORD": "пароль",
        "ODATA_DB_NAME": "имя_базы",
        "ODATA_DB_LABEL": "Понятная подпись",
        "ODATA_TIMEOUT_MS": "30000",
        "ODATA_RETRIES": "3",
        "ODATA_PAGE_SIZE": "100",
        "ODATA_MAX_ROWS": "1000",
        "LOG_LEVEL": "info",
        "READ_ONLY": "true"
      }
    }
  }
}
```

## Ссылки для OData-запросов (Basic Auth)

Base URL всегда оканчивается на `/odata/standard.odata/` (слэш обязателен).

- **Метаданные (JSON):** `.../odata/standard.odata/?$format=json`
- **Метаданные (XML):** `.../odata/standard.odata/$metadata`
- **Справочник (пример):** `.../odata/standard.odata/Catalog_Организации?$top=100&$format=json`
- **Фильтр:** `.../odata/standard.odata/Catalog_Организации?$filter=Description%20eq%20'ООО%20Ромашка'&$format=json`

Кириллицу в имени сущности URL-энкодить: `Catalog_Сотрудники` → `Catalog_%D0%A1%D0%BE%D1%82%D1%80%D1%83%D0%B4%D0%BD%D0%B8%D0%BA%D0%B8`.

## Диагностика: режимы 1С:Фреш (КРИТИЧНО, самая частая ошибка)

> На 1С:Фреш есть **разделённый** и **неразделённый** режим работы.

- **Неразделённый режим** → OData отдаёт **ТОЛЬКО метаданные**. Запросы к конкретным справочникам (`Catalog_Сотрудники`, `Catalog_Организации` и т.д.) возвращают **500 Internal Server Error** (или пустоту).
- **Разделённый режим** (split mode, ссылка содержит номер области вида `/<номер>/`) → OData отдаёт **данные**.

### Как отличить ссылки

| Режим | Пример URL |
|---|---|
| Неразделённый | `https://host/infobase/main_bub/ru_RU/` |
| Разделённый (область) | `https://host/infobase/main_int/281/ru_RU/` |

OData-адрес строится так же, но вместо `/ru_RU/` — `/odata/standard.odata/`.

## Важно про пользователей OData на Фреше

- Пользователь для **веб-входа** в область (напр. `OData281`) НЕ обязательно имеет доступ к OData → на OData-эндпоинте будет **401 Unauthorized**.
- Нужен пользователь, заведённый **внутри области** в обработке **«Настройка стандартного интерфейса OData»** (Администрирование → Настройка стандартного интерфейса OData).
- Рабочий пример из журнала: логин `OData.user` (заведён в области 281 «Карелия»; пароль — в opencode.jsonc / .env.local).

## Чек-лист подключения (чтобы не наступать на наши грабли)

1. Получить от пользователя **веб-ссылку** на базу/область (например `.../281/ru_RU/`).
2. Из неё построить OData-URL: заменить `/ru_RU/` на `/odata/standard.odata/`.
3. **Проверить метаданные** первым делом:
   ```powershell
   # с базовой авторизацией
   [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
   $wc = New-Object Net.WebClient
   $wc.Headers.Add("Authorization", "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("логин:пароль")))
   $r = $wc.DownloadString("https://<host>/<путь>/odata/standard.odata/?`$format=json")
   ```
4. **Проверить конкретный справочник** (`Catalog_Организации`):
   - `200 OK` → данные доступны, всё ок.
   - `500` → неразделённый режим (нужна ссылка на область/разделённый режим).
   - `401` → пользователь не заведён для OData (нужен пользователь из «Настройки стандартного интерфейса OData»).
   - `404` → неверный путь OData (проверь: `/odata/standard.odata/`).
5. Обновить `opencode.jsonc` (env) и `.env.local`.
6. Перезапустить opencode → проверить инструменты (`/reload`, затем запрос «покажи список организаций»).

## Подключение к другой области (новый агент, самостоятельно)

> ⚠️ **Важно:** подключение **новых баз** к OData осуществляется **только архитектором совместно с ПАК** (платёжно-администраторским концом / службой поддержки). Агент сам подключает **новую область уже существующей подключённой базы** (см. ниже) — это просто замена номера области.

Доступ к данным открыт в **разделённом режиме** — одна база может иметь много областей (регионов). Подключить новую область можно, **не трогая ничего, кроме номера области**:

1. Узнай у **оператора** номер нужной области (например `357`).
2. Возьми рабочий шаблон (область 281) и замени номер в URL:
   - Веб: `https://host.example.com/infobase/main_int/281/ru_RU/` → `.../357/ru_RU/`
   - OData: `https://host.example.com/infobase/main_int/281/odata/standard.odata/` → `.../357/odata/standard.odata/`
3. **Попроси оператора** завести пользователя для OData **внутри этой области** через обработку **«Настройка стандартного интерфейса OData»** (в области — свой пользователь, у веб-пользователя области прав на OData нет → 401).
4. Замени в конфиге `opencode.jsonc` (секция `mcpServers["1c-odata"].env`) значение `ODATA_BASE_URL` на OData-URL новой области и `ODATA_USERNAME` на логин из области. Пароль — из окружения, в файлах не хранить.
5. Проверь: метаданные → 200 OK, затем `Catalog_Организации` → 200 OK.
6. Перезапусти opencode и работай.

> Пароли в файлах проекта (`D:\<project>\AI_Agent`) **не хранить**. Только в окружении: `C:\Users\<username>\.config\opencode\opencode.jsonc` и `.env.local` (плейсхолдер в `.env.local`).

## Скрипты для работы с базой (переиспользуемые)

Готовые скрипты лежат в `D:\<project>\AI_Agent\OData\scripts\` — **не пиши новые, если они уже есть**. Перед запросом к базе сначала проверь каталог `scripts/`.

Запуск (Node.js — портативный, полный путь):
```powershell
$env:ODATA_PASSWORD = "пароль из окружения"
& "D:\<project>\AI_Agent\OData\tools\nodejs\node-v24.19.0-win-x64\node.exe" "D:\<project>\AI_Agent\OData\scripts\<скрипт>.mjs" [аргументы]
```

> Пароль не хардкодится в скриптах — передаётся переменной окружения `ODATA_PASSWORD` или берётся из `.env.local` / `.env`.

### Список скриптов

| Скрипт | Назначение | Пример |
|---|---|---|
| `odata-helper.mjs` | Общий модуль: `getEntities`, `getEntityByRef`, `loadCatalogMap`, `encEntity`. Импортируется другими скриптами | `import * as odata from './odata-helper.mjs'` |
| `find-entities.mjs` | Поиск сущностей OData по ключевому слову (по имени EntitySet) | `node scripts/find-entities.mjs Отпуск` |
| `vacations-last.mjs` | Последние N отпусков (`Document_Отпуск`) с ФИО сотрудника и организацией | `node scripts/vacations-last.mjs 10` |

### Как добавить новый скрипт

Скопируй паттерн из существующих скриптов:
1. `import * as odata from './odata-helper.mjs'` — даёт доступ к `getEntities(entity, {top, orderby, filter, select, skip})`.
2. Для человекочитаемых имён подтягивай справочники: `odata.loadCatalogMap('Catalog_Сотрудники')` → `Map` по `Ref_Key`.
3. Кириллические имена сущностей энкодятся автоматически через `encEntity` (внутри `getEntities`).
4. Создай скрипт в `scripts/`, протестируй с `ODATA_PASSWORD`, добавь строку в таблицу выше и в этот скилл.

## Коды ошибок (быстрая шпаргалка)

| Код | Значение | Действие |
|---|---|---|
| 200 | OK | Всё работает |
| 401 | Нет доступа к OData | Завести пользователя в «Настройке стандартного интерфейса OData» области |
| 404 | Путь не найден | Проверить `/odata/standard.odata/` в URL |
| 500 | Данные не отдаются | Неразделённый режим Фреш → нужна ссылка на область (разделённый режим) |
| 501 | `$count` не поддерживается | Не использовать `$count=true`, использовать `$top` |

## Рабочие подключения (из журнала)

### Область №281 «Карелия» (разделённый режим, данные доступны)

- OData: `https://host.example.com/infobase/main_int/281/odata/standard.odata/`
- Логин: `OData.user` / **пароль — см. opencode.jsonc / .env.local**
- Статус: 200 OK, 97 организаций в `Catalog_Организации`

### Неразделённый режим (только метаданные)

- OData: `https://host.example.com/infobase/main_bub/odata/standard.odata/`
- Логин: `OData` / **пароль — см. opencode.jsonc / .env.local**
- Метаданных: 6121 сущность. Данные справочников — НЕ доступны (500).

## Прочее

- Полная инструкция по проекту: `D:\<project>\AI_Agent\OData\SETUP.md`
- Документация проекта: `docs/CONNECTING.md`, `docs/ODATA-SETUP.md`
- Журнал всех сессий: `C:\Users\<username>\Desktop\AI_Agent_Memory\ЖУРНАЛ.md`
