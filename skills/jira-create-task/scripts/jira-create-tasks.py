#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
jira-create-tasks - batch-create Jira tasks from a list, using a project template.
Template (example): project key, issue type id, priority, reporter/assignee, Epic key,
sprint id (via Agile API).
Input: a UTF-8 text file, one task per line, or -Summary for a single task.
"""
import json, os, sys, urllib.request, urllib.error, argparse, time

TOKEN = os.environ.get("JIRA_TOKEN", "")
BASE = os.environ.get("JIRA_URL", "https://jira.example.com")
sys.stdout.reconfigure(encoding="utf-8")
urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({})))

# ---- template defaults (editable) ----
PROJECT = "PROJ"
ISSUETYPE_ID = "3"                # Задача
PRIORITY = "Основной"
USER = "<username>"
EPIC = "PROJ-1"
SPRINT_ID = 1                     # <sprint name> (ACTIVE)
CONTEXT = "Задача создана из списка работ (пример шаблона)."


def api(method, path, body=None):
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method,
        headers={"Authorization": "Bearer " + TOKEN, "Accept": "application/json",
                 "Content-Type": "application/json; charset=utf-8"})
    try:
        r = urllib.request.urlopen(req, timeout=60)
        raw = r.read().decode("utf-8")
        return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, e.read().decode("utf-8")[:400]); sys.exit(1)


def create(summary, add_to_sprint=True):
    desc = summary.strip().rstrip(".") + ".\n\n" + CONTEXT
    fields = {
        "project": {"key": PROJECT},
        "issuetype": {"id": ISSUETYPE_ID},
        "summary": summary.strip(),
        "description": desc,
        "priority": {"name": PRIORITY},
        "reporter": {"name": USER},
        "assignee": {"name": USER},
        "customfield_10006": EPIC,
    }
    c = api("POST", "/rest/api/2/issue", {"fields": fields})
    key = c["key"]
    if add_to_sprint:
        api("POST", "/rest/agile/1.0/sprint/%d/issue" % SPRINT_ID, {"issues": [key]})
    return key


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-TasksFile", default="", help="UTF-8 file, one task summary per line")
    ap.add_argument("-Summary", default="", help="create a single task with this summary")
    ap.add_argument("-NoSprint", action="store_true", help="skip adding to sprint")
    a = ap.parse_args()

    if a.Summary:
        tasks = [a.Summary]
    elif a.TasksFile:
        with open(a.TasksFile, encoding="utf-8-sig") as f:
            tasks = [ln.strip() for ln in f if ln.strip()]
    else:
        print("need -TasksFile or -Summary"); sys.exit(1)

    created = []
    for s in tasks:
        k = create(s, add_to_sprint=not a.NoSprint)
        created.append(k)
        print("%s  %s" % (k, s))
        time.sleep(0.3)
    print("\ntotal:", len(created))


if __name__ == "__main__":
    main()
