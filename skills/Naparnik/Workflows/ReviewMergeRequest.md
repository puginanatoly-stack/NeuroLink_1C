# ReviewMergeRequest — сквозное ревью MR через Напарник

Сквозной процесс: открытый MR → дифф → ревью Напарника → оформление → публикация
комментария в GitLab. Хост и проект берутся из `$env:NAPARNIK_GITLAB_HOST` /
`$env:NAPARNIK_GITLAB_PROJECT` / `$env:NAPARNIK_GITLAB_PROJECT_ID` — задай их один
раз как постоянные переменные окружения пользователя для своего GitLab-инстанса.

## Шаг 1. Выбрать MR

```powershell
$glab = "$env:LOCALAPPDATA\Programs\GLab\glab.exe"
& $glab api --hostname $env:NAPARNIK_GITLAB_HOST `
  "projects/$env:NAPARNIK_GITLAB_PROJECT_ID/merge_requests?state=opened&per_page=100" 2>$null |
  ConvertFrom-Json | Where-Object { -not $_.draft } |
  ForEach-Object { "!$($_.iid)`t$($_.title)" }
```

Если открытых не-драфтовых MR несколько — **спросить пользователя, какой ревьюить**
(не выбирать самостоятельно).

## Шаг 2. Собрать дифф

```powershell
powershell.exe -NoProfile -File "<путь до skills>/Naparnik/Tools/FetchMrDiff.ps1" `
  -MrIid <IID> -Project $env:NAPARNIK_GITLAB_PROJECT -GitLabHost $env:NAPARNIK_GITLAB_HOST
# сохранит в %TEMP%\mr<IID>_diff.txt
```

Диффы отдельных файлов с пустым телом (`diff_len=0`) — невидимые изменения
(правки кодировки, LFS-подобное) — игнорировать.

## Шаг 3. Запросить ревью у Напарника

Собрать файл-вопрос (инструкция + дифф), затем:

```powershell
powershell.exe -NoProfile -File "<путь до skills>/Naparnik/Tools/Naparnik.ps1" `
  ask -QuestionFile "C:\tmp\mr_q.txt" -NewSession -SkillName review
```

Для фильтрации «только важные» — добавить в вопрос: *«Перечисли ТОЛЬКО критичные
ошибки и явные баги. Игнорируй стилистику и незначительные замечания.»* Для лога
шагов инструментов — `-Verbose`.

## Шаг 4. Оформление

Напарник не стилизует текст — оформление делает агент. Рекомендуемая структура:

1. Заголовок с названием задачи/MR.
2. `## 🔴 КРИТИЧЕСКИЕ ОШИБКИ` — только реальные баги (несуществующие методы,
   неверная логика, падение). Каждая: `[ОПАСНОСТЬ] что → где → почему → как исправить`.
3. `## 🟠 ПРЕДУПРЕЖДЕНИЯ` — риски, производительность, конфликты.
4. `## 🔵 ИНФО (для сведения)` — стилистика, именование, мелочь (кратко).
5. Финал: явный вердикт («исправить опасности перед мержем» и т.п.).

Факты берутся из ревью Напарника, но переформатируются и приоритизируются агентом.
Точный формат заголовка — вопрос личного вкуса; спросить один раз и запомнить,
а не изобретать заново каждый прогон.

## Шаг 5. Показать и опубликовать

1. Показать итоговый текст пользователю.
2. **Дождаться явного утверждения** («публикуй» / «ок») — не публиковать раньше.
3. Опубликовать:

```powershell
$glab = "$env:LOCALAPPDATA\Programs\GLab\glab.exe"
& $glab api --hostname $env:NAPARNIK_GITLAB_HOST --method POST `
  "projects/$env:NAPARNIK_GITLAB_PROJECT_ID/merge_requests/<IID>/notes" `
  --field "body=@C:\tmp\comment.txt"
```

`--field "body=@файл"` читает файл целиком, кириллица сохраняется. `--input` для
JSON не передаёт `Content-Type` — не использовать.

**Обязательная проверка после публикации:** прочитать комментарий обратно
(`GET .../notes/<id>`) и сверить текст — кириллица не должна превратиться в
mojibake. Без этой проверки публикация не считается завершённой.
