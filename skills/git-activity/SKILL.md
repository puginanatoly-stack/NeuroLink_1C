---
name: git-activity
description: Анализ активности пользователя в Git/GitLab — коммиты/пуши, комментарии к MR, принятые мерджи (accepted), аппрувы, созданные и удалённые ветки, открытые/закрытые MR. Сбор из GitLab Events API через glab + локальный git log, сводные таблицы и детализация по периодам/проектам. Используй когда пользователь просит посмотреть активность пользователя в гите/гитлабе, «что делал такой-то», «покажи по себе коммиты/мерджи/ветки/комментарии», посчитать вклад человека
argument-hint: "чью активность смотреть (username) и за какой период"
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
---

# /git-activity — анализ активности пользователя в GitLab

Методика проверена на живом инстансе 01.09.2026 — сводка по типам действий, детализация принятых мерджей/созданных веток/комментариев/коммитов.

## Объекты и источники данных

- **GitLab:** `gitlab.example.com` (подставьте свой инстанс). CLI — `glab` (`$env:LOCALAPPDATA\Programs\GLab\glab.exe`, полный путь — в PATH может отсутствовать).
- **API:** `https://gitlab.example.com/api/v4/`. Проекты пользователя — свой список `<namespace>/<project>` (`<id>`), см. `projects` API для получения id.
- **Локальный git** — для статистики по строкам (`git log --numstat`), по локальным клонам.

## Получить ID и профиль пользователя

```powershell
$glab = "$env:LOCALAPPDATA\Programs\GLab\glab.exe"
# Свой профиль (текущий пользователь glab):
& $glab api --hostname "gitlab.example.com" "user"
# Поиск по username (из events вернётся author_id):
& $glab api --hostname "gitlab.example.com" "users?username=<username>"
```
ID пользователя нужен для events-эндпоинта: `users/<id>/events`. Пример ниже использует placeholder id **12067**, username `<username>` — подставьте свои.

## Сводка активности (быстрый старт)

Сбор нескольких страниц + группировка по типам действий:

```powershell
$glab = "$env:LOCALAPPDATA\Programs\GLab\glab.exe"
$all = @()
foreach ($p in 1..6) {   # страницы по 100; выйти при пустой
  $raw = (& $glab api --hostname "gitlab.example.com" "users/12067/events?per_page=100&page=$p" 2>$null) -join "`n"
  if (-not $raw.Trim()) { break }
  $all += ($raw | ConvertFrom-Json)
}
$oldest = ($all | Sort-Object created_at | Select-Object -First 1).created_at
"Period: $oldest .. $($all[0].created_at)  (всего $($all.Count))"
"--- By action ---"
$all | Group-Object action_name | Sort-Object Count -Descending | ForEach-Object { "{0,-16} {1}" -f $_.Name, $_.Count }
"--- By action+project ---"
$all | Group-Object @{e={"$($_.action_name) [$($_.project_id)]"}} | Sort-Object Count -Descending | ForEach-Object { "{0,-30} {1}" -f $_.Name, $_.Count }
```

ВАЖНО: консоль портит кириллицу — для разбора сохранять JSON в файл UTF-8 (`Out-File ... -Encoding utf8`) и читать через Read, а вывод группировки держать на ASCII (имена типов — латиницей).

## Типы событий (`action_name`) — маппинг на русский

| action_name | Что это |
|---|---|
| `pushed to` | Пуш коммитов в существующую ветку (commit_title = первое сообщение) |
| `pushed new` | **Создание ветки** (`push_data.ref`, ref_type=branch) |
| `deleted` | Удаление ветки (`push_data.action = removed`) |
| `accepted` | **Принятый/смерженный MR** (target_iid = номер MR, target_title = название) |
| `approved` | Аппрув MR |
| `opened` | Открытый MR |
| `closed` | Закрытый MR (без мержа) |
| `commented on` | Комментарий (target_iid = **id заметки**, НЕ номер MR!) |
| `created` | Созданный объект (label/wiki и т.п.) |
| `joined` | Присоединение к проекту |

## Фильтры Events API

```powershell
# Только по типу действия или по проекту (работает на сервере):
"users/12067/events?action=accepted&per_page=100"      # только принятые мерджи
"users/12067/events?project_id=7266&per_page=100"      # активность в конкретном проекте
# Фильтр по дате на сервере НЕНАДЁЖЕН: before работает, after отдаёт [] (проверено 01.09.2026)
```
При фильтре `action` из выборки выпадают события без этого типа — для полной картины собирать без `action` и группировать на клиенте.

## Период «за сегодня»/«за N дней» — фильтровать на клиенте

События идут от новых к старым: тянуть страницы по 100, пока не выйдем за нужную дату, затем `Where-Object` по `created_at`:

```powershell
$glab = "$env:LOCALAPPDATA\Programs\GLab\glab.exe"
$all = @()
foreach ($p in 1..10) {   # страницы по 100; стоп, когда страница целиком старее даты
  $raw = (& $glab api --hostname "gitlab.example.com" "users/12067/events?per_page=100&page=$p" 2>$null) -join "`n"
  if (-not $raw.Trim()) { break }
  $page = $raw | ConvertFrom-Json
  if (-not $page) { break }
  $all += $page
  if ($page[-1].created_at -lt "2026-09-01T00:00:00Z") { break }   # последнее событие страницы старее границы
}
$today = $all | Where-Object { $_.created_at -ge "2026-09-01T00:00:00Z" }
"Today: $($today.Count) events"
$today | Group-Object action_name | Sort-Object Count -Descending | ForEach-Object { "{0,-16} {1}" -f $_.Name, $_.Count }
```

## Детализация по категориям

```powershell
# Принятые мерджи (последние 10)
$all | Where-Object { $_.action_name -eq 'accepted' } | Sort-Object created_at -Descending | Select-Object -First 10 | ForEach-Object {
  "{0}  !{1}  {2}" -f $_.created_at.Substring(0,10), $_.target_iid, $_.target_title
}
# Созданные ветки (последние 10)
$all | Where-Object { $_.action_name -eq 'pushed new' } | Sort-Object created_at -Descending | Select-Object -First 10 | ForEach-Object {
  "{0}  [{1}]  {2}" -f $_.created_at.Substring(0,10), $_.project_id, $_.push_data.ref
}
# Комментарии (последние 10)
$all | Where-Object { $_.action_name -eq 'commented on' } | Sort-Object created_at -Descending | Select-Object -First 10 | ForEach-Object {
  "{0}  note:{1}  {2}" -f $_.created_at.Substring(0,10), $_.target_iid, $_.target_title
}
# Коммиты (последние 12)
$all | Where-Object { $_.action_name -eq 'pushed to' } | Sort-Object created_at -Descending | Select-Object -First 12 | ForEach-Object {
  "{0}  [{1}]  {2}  {3}" -f $_.created_at.Substring(0,10), $_.project_id, $_.push_data.ref, $_.push_data.commit_title
}
```

Детальные комментарии к конкретному MR (тексты) — через `glab mr view <номер> --comments` или API `projects/<id>/merge_requests/<iid>/notes`.

## Статистика по строкам (локальный git)

```powershell
# Вклад автора по количеству добавленных/удалённых строк:
git log --author="<username>" --numstat --pretty="%h %ad %s" --date=short
# Кто и сколько коммитов по авторам (сводка):
git shortlog -sn --all
# Активность по датам:
git log --author="<username>" --since="2026-08-01" --until="2026-09-01" --oneline
```
Локальный git видит только клонированные репо — для полной картины по всем проектам использовать Events API (см. выше).

## Проверенные грабли

1. **`commented on`**: `target_iid` = id заметки (коммента), не номер MR. Номер MR events не содержит — для привязки использовать API notes.
2. **Events API отдаёт ограниченный объём** (~600 событий / ~месяц без фильтров) — глубже в историю смотреть постранично до нужной даты и фильтровать на клиенте, либо через локальный `git log`.
3. **`after` серверный фильтр отдаёт `[]`** (проверено 01.09.2026 на `gitlab.example.com`), `before` работает — период всегда фильтровать на клиенте по `created_at`.
4. **`accepted` ≠ `merged`**: событие `accepted` фиксирует сам факт принятия MR пользователем; состояние `merged`/`closed` у MR смотреть отдельно (`merge_requests?state=all`).
5. **Кодировка**: кириллица в выводе glab ломается — JSON сохранять в UTF-8 файл и читать через Read.
6. **Имена проектов**: в events только `project_id` — маппинг id→`path_with_namespace` дозапрашивать через `projects/<id>` (проверенный список в разделе «Объекты и источники данных»).
