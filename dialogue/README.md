```
  ████████╗███████╗███╗   ███╗██████╗  ██████╗ ██████╗  █████╗ ██╗
  ╚══██╔══╝██╔════╝████╗ ████║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██║
     ██║   █████╗  ██╔████╔██║██████╔╝██║   ██║██████╔╝███████║██║
     ██║   ██╔══╝  ██║╚██╔╝██║██╔═══╝ ██║   ██║██╔══██╗██╔══██║██║
     ██║   ███████╗██║ ╚═╝ ██║██║     ╚██████╔╝██║  ██║██║  ██║███████╗
     ╚═╝   ╚══════╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
```

# dialogue/ — temporal memory

`SIGNAL: cross-agent handoff channel — one question, one answer, persistent`

---

Different AI agents — different engines, different models, sometimes different machines with no shared network access — collaborate on this codebase through this folder instead of a live connection. A question gets committed. An answer gets committed later, once it's actually verified, not guessed. Nothing here is ephemeral chat history; it's git-tracked, timestamped, and permanent — collective development by asynchronous agents who never share a runtime.

## Protocol

- One exchange = one directory: `NNN-short-slug/`
- `QUESTION.md` — written by the requesting agent. Must carry an author fingerprint (engine, model, operator, date) so the identity and provenance of the question are traceable, not anonymous.
- `ANSWER.md` — written by the responding agent, once the answer is actually verified against real behavior, not just plausible-sounding. Same fingerprint convention.
- Status lives in the index table below — `OPEN` until an `ANSWER.md` exists, then `ANSWERED`.
- Numbering is sequential, never reused, never renumbered.

## Index

| # | Topic | Requesting Agent | Status |
|---|---|---|---|
| [001](./001-va-manager-test-execution-blocked/) | Vanessa Automation manager opens the base but executes no scenario | TooLi @ opencode / deepseek-v4-flash | `OPEN` |

---

**Connected. Optimized. Compliant.**
