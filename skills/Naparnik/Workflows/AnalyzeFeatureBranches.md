# AnalyzeFeatureBranches — анализ свежих feature-веток

Процесс: найти свежие feature-ветки → собрать дифф от базовой ветки → прогнать
через Напарника («только критичные») → оформить → опубликовать (GitLab/Jira/иной
таск-трекер, по потребности).

## Шаг 1. Найти свежие feature-ветки

```powershell
$glab = "$env:LOCALAPPDATA\Programs\GLab\glab.exe"
& $glab api --hostname $env:NAPARNIK_GITLAB_HOST `
  "projects/$env:NAPARNIK_GITLAB_PROJECT_ID/repository/branches?search=feature&per_page=100" 2>$null |
  ConvertFrom-Json |
  Where-Object { [datetime]$_.commit.committed_date -ge (Get-Date).AddDays(-3) } |
  Sort-Object { [datetime]$_.commit.committed_date } -Descending |
  ForEach-Object { "$($_.name)`t$($_.commit.committed_date)" }
```

## Шаг 2. Оценить объём

```powershell
$cmp = & $glab api --hostname $env:NAPARNIK_GITLAB_HOST `
  "projects/$env:NAPARNIK_GITLAB_PROJECT_ID/repository/compare?from=develop&to=<branch>" 2>$null |
  Out-String | ConvertFrom-Json
# $cmp.commits.Count — коммитов впереди, $cmp.diffs.Count — файлов
```

Если веток несколько — **спросить пользователя, какие анализировать** (крупные
содержательнее, мелкие 1-2 файла быстрее).

## Шаг 3. Собрать дифф и проанализировать

Разбить большой дифф по объектам (например, по обработкам), собрать файл-вопрос
с инструкцией «перечисли ТОЛЬКО критичное», прогнать
`Naparnik.ps1 ask -SkillName raw -QuestionFile <файл>`.

**Кодировка — обязательный контроль.** Дифф через `glab` собирать только в
скрипте с `[Console]::OutputEncoding = UTF8` в начале — иначе PowerShell прочитает
stdout `glab` в cp866 и кириллица (`ВЫБРАТЬ` → `╨Т╨л╨С…`) уйдёт Напарнику, который
выдаст ложное «критичное замечание» про битый запрос. После сборки вопроса
проверить mojibake: `$text.IndexOf([char]0x2568)` должен быть `-1`.

## Шаг 4. Оформить и опубликовать

См. «Оформление» и «Показать и опубликовать» в `ReviewMergeRequest.md` — тот же
принцип: показать пользователю → дождаться явного «публикуй»/«ок» → публиковать.
