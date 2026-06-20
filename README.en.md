# AgentRoster

[한국어](./README.md) | **English**

> A beginner-friendly tool that **installs role-based agent (AI teammate) teams into Claude Code with a single command.**
> Pick a team and install it without hand-editing config files — and if you don't like it, **roll back** to the previous state.
>
> This is an **installer tool** for teams. It does **not** run the agents for you.

---

## 1. Requirements (just one)

- **Node.js 18+** — if you don't have it, get the **"LTS"** build from https://nodejs.org.
  - Check: type `node -v` in a terminal → if a number like `v20.x` appears, you're good.
- (Optional) **Claude Code** — installed agents are used inside Claude Code.

> AgentRoster itself needs **nothing extra to install** (zero dependencies). If you have `node`, it just works.

---

## 2. Quick start (3 steps, ~5 min)

1. Open a terminal in this folder. *(Windows: type `cmd` in the folder's address bar → Enter)*
2. Type and run:
   ```
   node bin/cli.mjs
   ```
3. In the menu, **just type a number** → "Install a team" → pick a team → confirm → done!

> On Windows you can also **double-click** `bin\시작하기.bat`.

When it finishes, you'll see guidance — **fully quit and reopen Claude Code**, then try something like `Have the reviewer agent review this code`.

---

## 3. Commands (instead of the menu)

| Command | What it does |
|---------|--------------|
| `node bin/cli.mjs` | Interactive menu (easiest) |
| `node bin/cli.mjs list` | List installable teams |
| `node bin/cli.mjs doctor` | Check your environment |
| `node bin/cli.mjs install web-app-team` | Install the web app team |
| `node bin/cli.mjs custom` | Build your own team by picking roles |
| `node bin/cli.mjs roles` | Create / edit / remove your own roles |
| `node bin/cli.mjs verify` | Show install status + how to confirm in Claude Code |
| `node bin/cli.mjs rollback` | Roll back |
| `node bin/cli.mjs export web-app-team` | Export a team to a file (for sharing) |
| `node bin/cli.mjs import <file>` | Safely install a received team file |

Options: `--global` (`-g`) **install for every folder** (install once, use anywhere) · `--dir <folder>` target folder (default = current) · `--out <file>` export file path · `--yes` skip confirmation

> **This folder, or all folders?** The menu asks **"this folder only" (project-scoped, safest) vs "all folders" (global)**. On the CLI use `install ... --global`. Global appears in **every project right away**, but if a name already exists it is **overwritten (auto-backed-up first; restore with `rollback --global`)**. For safety, global install does **not** auto-configure MCP — it only shows the command.

> **Sharing teams:** Give the `*.agentroster.json` file made by `export` to someone else, and they can install the same team with `import`. Shared files **never contain secret values** (key names only). When you `import` a received file, the **commands to be installed are shown for confirmation first**, and dangerous names / wrong formats / oversized files are auto-rejected.

---

## 4. Installable teams (3)

| Team id | Name | Roles (AI teammates) |
|---------|------|------|
| `web-app-team` | Web App Build Team | planner · frontend-dev · backend-dev · reviewer |
| `docs-team` | Docs / Content Team | writer · editor · fact-checker |
| `research-team` | Research Team | researcher · analyst · critic |

> **Create your own roles:** Use the `roles` command (or the "Manage my roles" menu) to make your own role (e.g. "SEO expert") by answering simple questions (name, what it does, permissions). Your roles show up alongside the built-in ones in "Build your own team", and are **saved in your home folder for reuse across any project**.

---

## 5. Where are files created?

Installing creates files inside the **current folder** (or the one given with `--dir`):

| Location | Contents |
|----------|----------|
| `.claude/agents/*.md` | The agent (teammate) files |
| `.mcp.json` | Tool (MCP) connection config — existing settings are **merged, not overwritten** |
| `.agentroster/backups/...` | Backups for rollback (auto-excluded from Git) |

---

## 6. ⚠️ The single most important thing after installing

**Newly installed agents only show up in a "freshly reopened" Claude Code window.**
- **Fully quit** Claude Code and **reopen** it. (It must be a **blank new window** with no previous conversation.)
- If you "closed and reopened" but the old conversation is still there → it's still in **resume mode**, so new agents won't appear. Open a truly new window.

**How to confirm:** In the new window, type `/agents` or `Call the reviewer agent` → if the installed role names appear, success.
If unsure about the install state, run `node bin/cli.mjs verify` to see installed agents and how to confirm again.

---

## 7. Troubleshooting (symptom → cause → fix)

| Symptom | Cause | Fix |
|---------|-------|-----|
| `node`/`npx` "command not found" | Node.js not installed | Install LTS from https://nodejs.org and retry |
| Hangs or network error during install | Corporate proxy / firewall | Try another network / ask admin to unblock |
| Windows says "this app was blocked" | SmartScreen / antivirus | Right-click file → Properties → check "Unblock" / add AV exception |
| PowerShell blocks the script | Execution policy | Don't permanently change the policy; run via `node bin/cli.mjs` (cmd) instead |
| Garbled Korean/text | Non-ASCII/space in path / cmd encoding (CP949) | Prefer ASCII, space-free paths. The `.bat` sets UTF-8 at startup |
| Installed agents don't appear in Claude Code | **No restart, or resume mode** | **Fully quit, then open a blank new window** (most common cause) |
| Feels installed in the wrong place | Global vs project folder confusion | This tool installs to the **current (project) folder**. Run `doctor` to confirm |
| "An agent with the same name exists" | Name collision | Auto-backed-up before install → safe to overwrite; `rollback` restores |
| An agent errors on a tool | Missing API key for an MCP | Get a key from the MCP provider → store it in an **OS environment variable** (never put it in files) |
| Claude Code doesn't know the agent | Claude Code missing/outdated | Install/update Claude Code and retry |
| Want to undo but don't know how | — | `node bin/cli.mjs rollback` → choose a point |
| Don't know where backups are | — | Inside `<current folder>\.agentroster\backups\`, kept by timestamp |
| Permission (write) error | Folder not writable | **Admin rights are NOT required.** Run in a writable folder (e.g., Documents) |

> macOS/Linux: paths and entry differ slightly. **Windows is the primary supported platform** for now; the core commands (`node bin/cli.mjs ...`) work the same.

---

## 8. Safety · Disclaimer (please read)

- Every install **takes an automatic backup first.** You can always `rollback`.
- **Secrets like passwords/API keys are never stored in files.** (MCP config stores only the key *name*; the value stays in your OS environment variable.)
- This software is provided **"AS IS" with no warranty.** You are responsible for its use.
- Check the **pricing/terms/policies of any external tools (MCP)/APIs** you install — yourself.

---

## 9. License · Trademarks

- **Apache License 2.0** — commercial use, modification, copying, and redistribution are allowed (conditions: keep license/copyright notices, state changes, preserve `NOTICE`). See [`LICENSE`](./LICENSE) · [`NOTICE`](./NOTICE).
- "Claude Code", "Codex", "Anthropic", and "OpenAI" are trademarks of their respective owners; **AgentRoster is unofficial and not affiliated.**

> For development/testing, see [`DEVELOPMENT.md`](./DEVELOPMENT.md).
