# SoDam-Agent

[![CI](https://github.com/sodam-ai/SoDam-Agent/actions/workflows/ci.yml/badge.svg)](https://github.com/sodam-ai/SoDam-Agent/actions/workflows/ci.yml)

[한국어](./README.md) | **English**

> A **beginner-friendly** tool that adds **role-based AI teammate teams** (planner, developer, reviewer, …) to Claude Code with **a single plugin install** — and lets you **create, train, and manage your own agents even after installing**.
> No hand-editing config files — **a few commands** inside Claude Code and you're set.
> This is an **installer tool** for teams. It does **not** run the agents for you.

> 📛 **Naming note (so you don't get confused)**
> - **Product / repository name = `SoDam-Agent`** (marketplace address: `sodam-ai/SoDam-Agent`)
> - **The `@sodamagent-marketplace` in install commands = the marketplace's internal id.** The letters differ from the product name, but that's **normal** — just type it as-is.

---

## 📑 Table of Contents
0. [Current version status · update summary](#0-current-version-status--update-summary)
1. [What is SoDam-Agent? (in plain words)](#1-what-is-sodam-agent-in-plain-words)
2. [Prerequisites & required programs](#2-prerequisites--required-programs)
3. [Download & install](#3-download--install)
4. [Quick start (3 steps)](#4-quick-start-3-steps)
5. [What you can install (10 teams + management tool)](#5-what-you-can-install-10-teams--management-tool)
6. [How to use it](#6-how-to-use-it)
7. [Manage your own agents after install (sodam-agent)](#7-manage-your-own-agents-after-install-sodam-agent)
8. [Command reference](#8-command-reference)
9. [Workflow](#9-workflow-at-a-glance)
10. [File & document locations](#10-file--document-locations)
11. [Troubleshooting](#11-troubleshooting-symptom--cause--fix)
12. [Safety & disclaimer](#12-safety--disclaimer)
13. [License · Copyright · Commercial use](#13-license--copyright--commercial-use-important)
14. [Security & data flow](#14-security--data-flow)
15. [Architecture](#15-architecture)
16. [FAQ (frequently asked questions)](#16-faq-frequently-asked-questions)
17. [Community Sharing Directory (optional)](#17-community-sharing-directory-optional)
- ✨ [Using it in Codex too (role translation · beta)](#using-it-in-codex-too-role-translation--beta)
- ✨ [Using it in Gemini CLI too (role translation · beta)](#using-it-in-gemini-cli-too-role-translation--beta)
- ✨ [Using it in Cursor too (role translation · beta)](#using-it-in-cursor-too-role-translation--beta)

---

<h2 id="0-current-version-status--update-summary">0. Current version status · update summary</h2>

**Available now**: 10 teams (web app · docs · research · marketing · data · security audit · devops · customer support · PM/product · localization) + the agent-management tool (`sodam-agent`) + Codex / Gemini CLI / Cursor role translation (beta)

<details open>
<summary>📋 <b>Recent major changes</b> (as of 2026-07-16 — click to collapse)</summary>

- **2026-07-16**: Added the customer-support, PM/product-management, and localization teams — 10 teams complete. Hardened the core backup/rollback files to write atomically (tmp→rename), so a mid-write crash can no longer leave a half-written record behind. Added a GitHub Actions CI workflow that runs tests and a security audit on every push/PR (status shown live via the badge at the top of this README). **[Security] Found and blocked a "frontmatter injection" attack** where a shared team file could smuggle an agent permission line (e.g. `tools: Bash`) by putting a newline in a role's description/model value (reproduced, fixed, 2 regression tests added — the install preview now always matches what actually gets installed).
- **2026-07-15**: Added Phase 1 of the community sharing directory (optional) — register and browse teams via a `community/index.json` catalog and GitHub Pull Requests, with no server or accounts. See [§17](#17-community-sharing-directory-optional).
- **2026-07-13**: Reconfirmed all 7 teams in a completely separate, brand-new Claude Code session (reproducibility verified — not a fluke). Found and fixed a bug where the import feature's dangerous-command detector missed `.exe`-suffixed/uppercase commands (e.g. `cmd.exe`). Ran a follow-up OWASP-informed security review (secrets, randomness, error exposure, dependencies all checked) and re-confirmed safety with a live CLI run against a synthetic malicious file.
- **2026-07-12**: Completed live verification — installed and called all 7 teams in a real Claude Code session, confirmed working (not a mockup; meets `01_PRD.md` success criterion #1). Fixed 3 bugs in `install`/`export`/`list` around empty-string input handling. Confirmed `/reload-plugins` applies new plugins without a full restart and updated Step 5 accordingly. Corrected stale team-count wording (5→7, 6→8) across the docs. Ran a security review (OWASP-informed) and pre-registered `.env` in `.gitignore`.
- **2026-07-11**: Added the security-audit team and devops team — 7 teams complete. Also added Gemini CLI and Cursor role translation (beta).
- **2026-07-06**: Found and fixed installed copies silently running stale (pre-fix) code + repaired the plugin version-bump process so future updates actually take effect · closed a gap where installing a team file from someone else could skip confirmation · hardened rollback so it stays reliable even if the process is killed mid-install · added a typed-"YES" confirmation gate for global (all-folder) install/rollback · fixed `npm audit` so it can actually run (result: 0 vulnerabilities) · fixed a latent bug in the preset-sync tool (would silently drop MCP servers beyond the first) · resolved 3 of 5 legal-review items (trademark, preset provenance, trademark boundary)
- **2026-07-04**: Fixed subagent tool permissions (allow/deny lists) so they're applied correctly on the direct-CLI install path too (the marketplace-plugin install path was already correct). Corrected the "verified on Pro+" wording to "expected, not yet verified."
- **2026-07-03**: Fixed subagents not inheriting a team's bundled tool (MCP, e.g. context7).
- **2026-06-29**: Added the marketing team and data team — 5 teams complete.
- **2026-06-23**: Added Codex (another AI coding tool) role translation (beta).
- **2026-06-21**: Introduced marketplace-based install + the agent-management tool (`sodam-agent`).

</details>

This is a human-readable summary. For the full, itemized history see the [GitHub commit log](https://github.com/sodam-ai/SoDam-Agent/commits/).

---

## 1. What is SoDam-Agent? (in plain words)

Claude Code lets you give tasks to an AI — usually you talk to **one AI**.
**SoDam-Agent** adds **several AI teammates (subagents) as a "team set"** to Claude Code at once. And **even after installing**, you can **create new agents yourself** and **train them** to behave the way you want.

- Analogy: it "hires" *role-based teammates* — **planner · frontend-dev · backend-dev · reviewer** — for your previously solo AI, and lets you *hire and train more* as needed.
- You **never** create files or edit config by hand. Just pick from menus/commands.

> In one line: **"A tool that installs AI teammate teams into Claude Code, and lets you create and train your own."**

> 💡 **Brand new to computers, smartphones, or AI? Start here.**
> This document assumes you can already **open a program called Claude Code**. (Installing Claude Code itself on your computer is outside the scope of this document — that's covered separately on the [official site](https://claude.com/claude-code). We assume that part is already done, and this document picks up from there.) Here are the only words you'll need after that — take your time.
>
> | Word | Plain-language meaning |
> |---|---|
> | **Click** | Pressing and releasing a mouse button once. On a phone, this is the same as a "tap" — touching the screen once with your finger. |
> | **Input box** | The rectangular field where you type text. It's at the bottom of the Claude Code screen (different from the "terminal" described below). |
> | **Copy / paste** | Moving text without retyping it. Drag your mouse over the text you want (it turns blue/highlighted), then hold `Ctrl` and press `C` (copy) → click where you want it → hold `Ctrl` and press `V` (paste). |
> | **Folder** | Like a "drawer" or "box" inside your computer that holds files. |
> | **File** | A single saved item on your computer, like a document or a photo. |
> | **Download** | Bringing something from the internet onto your own computer and saving it. |
> | **Program (app)** | A tool you install and run on a computer or phone. Claude Code is one of these. |
> | **Terminal (a.k.a. black window, command prompt)** | A black screen where you type commands as text. **The method this document recommends (Method A) needs no terminal at all** — just the Claude Code "input box." A terminal only shows up in the optional Codex/Gemini CLI/Cursor sections below. |
> | **Plugin** | A *part you snap into* a program to add a feature. (SoDam-Agent is that part.) |
> | **Marketplace** | A *shop* where plugins are collected. You register it here to pull plugins from it. |
> | **Agent (subagent)** | One AI teammate. |
> | **AI · chatbot** | A program that answers you in text, the way a person would, when you type a question. Claude Code is a program for talking with an AI called "Claude." |
>
> Once you know these words, everything below is just following the steps in order. If you get stuck, check [§11 Troubleshooting](#11-troubleshooting-symptom--cause--fix) for the same symptom.

---

## 2. Prerequisites & required programs

| Item | Required? | Notes |
|---|---|---|
| **Claude Code** | ✅ Required | Teammates are used **inside** Claude Code. (Install from the [official site](https://claude.com/claude-code).) |
| **Internet** | ✅ Required | To fetch the plugin and download some tools (MCP). |
| **Node.js 18+** | 🟡 Optional (recommended) | The doc-search tool (**context7 MCP**) used by `web-app-team`·`research-team` runs via `npx` (= Node). Without Node, **the teammates still work; only that tool is unavailable.** Get the **LTS** build from [nodejs.org](https://nodejs.org). |

> Check (optional): type `node -v` in a terminal → a number like `v20.x` means Node is ready.

---

## 3. Download & install

There are two methods. **For most people, Method A (marketplace)** is all you need.

### ⭐ Method A — Install from the marketplace (recommended, easiest)
**A few commands** inside Claude Code. No terminal, no folder navigation.

1. **Open Claude Code.**
2. **Add the marketplace** (one time only):
   ```
   /plugin marketplace add sodam-ai/SoDam-Agent
   ```
   🖥️ Success when you see a "marketplace added" message.
3. **Install the team you want:**
   ```
   /plugin install web-app-team@sodamagent-marketplace
   ```
   - Other teams: `docs-team@sodamagent-marketplace` · `research-team@sodamagent-marketplace`
4. **(Optional) Install the agent-management tool** — to create & train your own agents:
   ```
   /plugin install sodam-agent@sodamagent-marketplace
   ```
5. **Load what you just installed.**
   - **Try this first**: `/reload-plugins` — no full quit/reopen needed, this alone applies it immediately (confirmed by real testing, 2026-07-12).
   - ⚠️ **The most common gotcha**: right after install, typing `@`·`/sodam-agent:` may **not show anything in the autocomplete** — plugins are **loaded at startup or reload**. If `/reload-plugins` doesn't help, fall back to **fully quitting and reopening Claude Code**.

> 💡 `@sodamagent-marketplace` is the marketplace's internal id — type it as-is (it's fine that it differs from the product name SoDam-Agent).

### Method B — Run it from your own folder (inside Claude Code, no terminal)
Instead of the online marketplace, you can **register a downloaded folder as a "store."**
1. Get this repository (`git clone` or download the ZIP from GitHub and unzip).
2. In the Claude Code **input box** (⚠️ **no quotes**, prefer a space-free path):
   ```
   /plugin marketplace add C:\downloaded-folder\SoDam-Agent
   ```
3. Then install teams/tool (skip this and the `@` autocomplete will be empty):
   ```
   /plugin install web-app-team@sodamagent-marketplace
   /plugin install sodam-agent@sodamagent-marketplace
   ```
4. **Restart** to apply.
> 💡 If you prefer a terminal: `claude --plugin-dir "<downloaded folder>\plugins\web-app-team"` also works (repeat `--plugin-dir` for multiple teams).

---

## 4. Quick start (3 steps)

1. In Claude Code: `/plugin marketplace add sodam-ai/SoDam-Agent` (once).
2. `/plugin install web-app-team@sodamagent-marketplace` → **restart**. (★ Not sure which team to pick? Start with this one — the most general-purpose.)
3. Type `@web-app-team:` in the input box — if the autocomplete shows a name like **`web-app-team:reviewer`**, you're done → use it: `Have web-app-team:reviewer review this code`.

> Expected time: **about 2–3 minutes.** (To also create/train agents, install `sodam-agent` in step 4 above.)

---

## 5. What you can install (10 teams + management tool)

**① Team plugins (bundles of AI teammates)**

| Team (install name) | Name | AI teammates (roles) | Bundled tool (MCP) |
|---|---|---|---|
| ★ `web-app-team` | Web App Build Team (recommended first pick) | planner · frontend-dev · backend-dev · reviewer | context7 (library-docs search) |
| `docs-team` | Docs / Content Team | writer · editor · fact-checker | none |
| `research-team` | Research Team | researcher · analyst · critic | context7 |
| `marketing-team` | Marketing Team | copywriter (copy & content) · seo-analyst (SEO) · social-manager (social media) | none |
| `data-team` | Data Team | data-engineer (collect & clean) · data-analyst (analysis) · data-viz (visualization) | none |
| `security-audit-team` | Security Audit Team | security-auditor (vulnerability scan) · vulnerability-analyst (risk analysis) · compliance-reviewer (compliance check) | none |
| `devops-team` | DevOps/Deployment Team | deploy-engineer (deployment design) · cicd-manager (CI/CD setup) · infra-troubleshooter (incident diagnosis) | none |
| `customer-support-team` | Customer Support Team | support-agent (inquiry response) · faq-writer (FAQ/manual writing) · feedback-analyst (complaint analysis) | none |
| `pm-team` | PM/Product Management Team | requirements-analyst (requirements gathering) · roadmap-planner (schedule/priority) · meeting-scribe (meeting notes) | none |
| `localization-team` | Translation/Localization Team | translator (translation) · localization-specialist (localization) · terminology-reviewer (terminology check) | none |

> Each teammate gets **least-privilege tools** (e.g., the reviewer is read-only). Model is `inherit` (follows your default model).

**② Management tool plugin (`sodam-agent`)** — after installing teams, this is the **command set to create and train your own agents**. See [section 7](#7-manage-your-own-agents-after-install-sodam-agent).

---

## 6. How to use it

After installing, teammates are registered as **`team:role`** (e.g., `web-app-team:reviewer`).

- **Verify**: type `@web-app-team:` in the input → check the autocomplete list for `web-app-team:reviewer` etc.
  - The `team:` prefix makes them **unambiguous** versus similarly named agents from elsewhere.
- **How to call one (pick whichever is easiest):**
  1. Natural language: `Ask web-app-team:reviewer to review this code`
  2. Explicit (@-mention): type `@` in the input → pick from the autocomplete list.
  3. Automatic: Claude may delegate to the right teammate based on the task.
- **Tools (MCP)**: installing `web-app-team`·`research-team` **also connects the context7 (doc search) tool** automatically (no extra setup).

> 💡 Plugins are visible in **every folder and every session** right away (after one restart) — no need to launch Claude in a specific folder.

---

## Using it in Codex too (role translation · beta)

Besides Claude Code, you can use the same team in **Codex (another AI coding tool)**.
But, **honestly**: Codex has no concept of *"several agents running as a separate team"* like Claude Code.
So instead of "the same team," it **"translates" each role into Codex's way (an instructions file + skills)** (beta).

> ⚠️ **This feature alone needs a terminal** (unlike plugin install). Codex users are usually comfortable with a terminal.

**Prerequisites**
- A downloaded copy of this repo (like [Method B in section 3](#3-download--install): GitHub ZIP or `git clone`)
- **Node.js 18+** (needed to run the CLI — [nodejs.org](https://nodejs.org) LTS)

**How to install** — from the downloaded SoDam-Agent folder, targeting the project folder you'll use with Codex:
```
node bin/cli.mjs install web-app-team --target codex --dir "C:\my\project\folder"
```
- Omit `--dir` to use the **current folder**. · Swap the team for `docs-team`·`research-team`.
- It shows a **preview of what will be created** and asks for confirmation (`--yes` to skip).

**What gets created (file locations)**

| File | Location | Role |
|---|---|---|
| `AGENTS.md` | project folder root | The **role instructions** Codex reads on start (roles = "modes") |
| `SKILL.md` | `.agents/skills/<role>/SKILL.md` | Per-role detailed instructions |
| MCP config (TOML) | `~/.codex/config.toml` | Tools like doc search (context7). **Not touched automatically** — paste the printed TOML yourself |

> If an `AGENTS.md` already exists, it is **backed up to `AGENTS.md.bak`** before writing (safe).

**How to use**
- Run **Codex in that folder**; it reads `AGENTS.md` and applies the role instructions.
- For doc search (context7), paste the **TOML snippet shown at install into `~/.codex/config.toml` and restart Codex**.

**Troubleshooting**

| Symptom | Fix |
|---|---|
| Codex ignores the roles | Make sure you ran Codex **in that folder** (elsewhere it can't read `AGENTS.md`) |
| The doc-search tool is missing | Add the TOML to `~/.codex/config.toml`, **restart Codex** / check Node.js is installed |
| No parallel "same team" collaboration | That's normal — Codex follows roles as **instructions** (not a parallel team) |

> 🔎 Verify recognition in your actual Codex runtime once (behavior may vary by tool/version).

---

## Using it in Gemini CLI too (role translation · beta)

Like Codex, you can also use the same team in **Gemini CLI (Google's AI coding tool)**.
Gemini CLI's structure is closer to Claude Code's (one role = one file), so the mapping is more direct than Codex's — but **honestly**: this version generates roles with **full tool inheritance** (no restrictions), because Gemini's tool-name scheme differs from Claude Code's (e.g. `read_file` vs `Read`), and restricting tools without a verified mapping risks producing broken output.

> ⚠️ **This feature alone needs a terminal** (unlike plugin install), same as Codex.

**Prerequisites**
- A downloaded copy of this repo
- **Node.js 18+** (needed to run the CLI — [nodejs.org](https://nodejs.org) LTS)

**How to install** — from the downloaded SoDam-Agent folder, targeting the project folder you'll use with Gemini CLI:
```
node bin/cli.mjs install web-app-team --target gemini --dir "C:\my\project\folder"
```
- Omit `--dir` to use the **current folder**. · Swap the team for `docs-team`·`research-team`.
- It shows a **preview of what will be created** and asks for confirmation (`--yes` to skip).

**What gets created (file locations)**

| File | Location | Role |
|---|---|---|
| `<role>.md` | `.gemini/agents/<role>.md` | Per-role subagent Gemini CLI reads (one role = one file, similar to Claude Code) |
| MCP config (mcpServers) | pasted into each role file yourself | Tools like doc search (context7). **Not touched automatically** — paste the printed snippet into whichever role file you want |

> If a role file already exists, it is **backed up to `.bak`** before writing (safe).

**How to use**
- Run **Gemini CLI in that folder**; it recognizes the roles under `.gemini/agents/` as subagents.
- For doc search (context7), paste the **mcpServers snippet shown at install into the frontmatter of whichever role file you want**.

**Troubleshooting**

| Symptom | Fix |
|---|---|
| Gemini CLI can't find the roles | Make sure you ran Gemini CLI **in that folder** (elsewhere it can't read `.gemini/agents/`) |
| The doc-search tool is missing | Add the mcpServers snippet to a role file, then restart Gemini CLI / check Node.js is installed |
| Tools/permissions are wide open | That's expected — this version doesn't generate tool restrictions (beta limitation, see above) |

> 🔎 Verify recognition in your actual Gemini CLI runtime once (behavior may vary by tool/version).

---

## Using it in Cursor too (role translation · beta)

Like Codex and Gemini CLI, you can also use the same team in **Cursor (another AI coding editor)**.
Cursor's `.cursor/rules` isn't a "callable role (subagent)" concept like Claude Code — it's context injected automatically/manually based on conditions (confirmed from official docs). So, like Codex, this **"translates" each role into a "mode" description inside `AGENTS.md`** rather than "the same team" (beta).

> ⚠️ **This feature alone needs a terminal** (unlike plugin install), same as Codex and Gemini CLI.

**Prerequisites**
- A downloaded copy of this repo
- **Node.js 18+** (needed to run the CLI — [nodejs.org](https://nodejs.org) LTS)

**How to install** — from the downloaded SoDam-Agent folder, targeting the project folder you'll use with Cursor:
```
node bin/cli.mjs install web-app-team --target cursor --dir "C:\my\project\folder"
```
- Omit `--dir` to use the **current folder**. · Swap the team for `docs-team`·`research-team`.
- It shows a **preview of what will be created** and asks for confirmation (`--yes` to skip).

**What gets created (file locations)**

| File | Location | Role |
|---|---|---|
| `AGENTS.md` | project folder root | The **role descriptions** Cursor reads (roles = "modes") |
| MCP config | `.cursor/mcp.json` | Tools like doc search (context7). **Unlike Codex/Gemini, this one connects automatically** (after your confirmation, existing config preserved) |

> If an `AGENTS.md` already exists, it is **backed up to `AGENTS.md.bak`** before writing (safe).

**How to use**
- Run **Cursor in that folder**; it reads `AGENTS.md` and uses the role descriptions as context.
- MCP is already connected in `.cursor/mcp.json` at install time — no extra step needed.

**Troubleshooting**

| Symptom | Fix |
|---|---|
| Cursor ignores the roles | Make sure you ran Cursor **in that folder** (elsewhere it can't read `AGENTS.md`) |
| The doc-search tool is missing | Check `.cursor/mcp.json` has a context7 entry / verify Node.js is installed, then restart Cursor |
| No callable "same team" subagents | That's normal — Cursor's rules are reference context, not callable roles (beta limitation) |

> 🔎 Verify recognition in your actual Cursor runtime once (behavior may vary by tool/version).

---

## 7. Manage your own agents after install (sodam-agent)

With `sodam-agent` installed, you can create and manage agents **inside Claude Code with slash commands** — no terminal. (Recent Claude Code versions don't even have a "Create" screen in `/agents` anymore — it just tells you to edit files by hand. This replaces that with **one easy command**.)

> Type `/sodam-agent:` to narrow to the 5 commands below. (Don't see them? → **restart**.)

| Command | What it does | One-line note |
|---|---|---|
| `/sodam-agent:new-agent` | **Create a new agent** | Asks name·job·personality, then creates your agent (`.claude/agents/`). |
| `/sodam-agent:training-agent` | **Train an agent** | Edits the agent's instructions to change its behavior. *(read "What is training?" below)* |
| `/sodam-agent:save-agent` | **Save / reuse an agent** | Saves your agent globally (usable in every project) or backs it up. |
| `/sodam-agent:pick-agent` | **Copy a team agent to yours** | Copies a team agent into your own agents. |
| `/sodam-agent:remove-agent` | **Delete an agent** | Safely deletes your agent (`.bak` backup + "delete for sure?" confirm). ⚠️ The list may also show agents you **actually use** — the first time, practice on a throwaway agent made with `new-agent` before deleting anything real. |

### 🎓 What is "training"? (an honest explanation)
- Here, **training is NOT re-training the AI.** It edits the agent's **instructions (system prompt)** to change behavior. (e.g., "Reviewer, from now on focus on **security**.")
- **Agents you created** → edit them **directly** with `training-agent` (easiest).
- **Team agents** (`web-app-team:reviewer`, etc.) → **cannot be edited directly.** Your edits would be wiped on the next plugin update. Instead, use `pick-agent` to **make a copy**, then train the copy. (Like copying a library book into your own notebook to mark it up, instead of writing in the book.)

### 🔒 Safety when creating
- Names allow **safe characters only** (letters·digits·hyphens) → blocks path tricks.
- **No passwords/API keys written directly** (only the env-var *name* if needed).
- Shows a **preview** before changes; deletion goes through **backup + confirm**.

---

## 8. Command reference

> All commands below are typed in the **Claude Code input box** (not a black terminal).

| Command | What it does |
|---|---|
| `/plugin marketplace add sodam-ai/SoDam-Agent` | Register the SoDam-Agent marketplace (first time) |
| `/plugin install web-app-team@sodamagent-marketplace` | Install the web app team (swap the team name for others) |
| `/plugin install sodam-agent@sodamagent-marketplace` | Install the agent-management tool |
| `/plugin` | Plugin manager (installed list · uninstall · enable/disable) |
| `@<name>` (type directly in the input) | Verify/call an installed AI teammate via autocomplete (recent Claude Code versions no longer show a list via `/agents`) |
| `/sodam-agent:new-agent` | Create a new agent |
| `/sodam-agent:training-agent` | Train an agent |
| `/sodam-agent:save-agent` | Save / reuse an agent |
| `/sodam-agent:pick-agent` | Copy a team agent into yours |
| `/sodam-agent:remove-agent` | Delete an agent (backup + confirm) |
| `/reload-plugins` | Load newly installed/edited plugins **without a full restart** (try this first after step 5) |

---

## 9. Workflow at a glance

```
Add marketplace (once) → Install teams/tool (/plugin install) → Restart
   → Verify by typing @team-name: (autocomplete shows team:role)
   → Call a teammate (natural language / @)
   → (optional) /sodam-agent:new-agent to create → training-agent to teach
   → Remove via /sodam-agent:remove-agent or /plugin when done
```

---

## 10. File & document locations

- **Installed plugin cache** (managed automatically by Claude Code): `~/.claude/plugins/cache/`
- **Agents you create**: `<project>/.claude/agents/<name>.md` (global save: `~/.claude/agents/`)
- **This repository's structure**:
  - `.claude-plugin/marketplace.json` — marketplace catalog (8 plugins — 7 teams + the agent-management tool, all registered)
  - `plugins/<team>/.claude-plugin/plugin.json` — team metadata
  - `plugins/<team>/agents/<role>.md` — one AI teammate (description + instructions)
  - `plugins/<team>/.mcp.json` — the team's tool (MCP) config (web-app · research)
  - `plugins/sodam-agent/commands/*.md` — the 5 agent-management commands
- **Docs**: `README.md` (KO) · `README.en.md` (EN, this file) — both also have an identical `.html` copy (same content) · `LICENSE` · `NOTICE` (No PDF copies are provided — md/html is sufficient and keeps maintenance overhead down. There is no separate "beginner guide" document — everything a first-time user needs is in this one README.)

---

## 11. Troubleshooting (symptom → cause → fix)

| Symptom | Cause | Fix |
|---|---|---|
| Installed but typing `@`·`/sodam-agent:` shows **nothing** in autocomplete | **Didn't reload** (plugins load at startup/reload) | Try `/reload-plugins` first. Still missing? **Quit and reopen Claude Code** |
| `/sodam-agent` shows **unrelated stuff** (team-agents, etc.) | `sodam-agent` not installed or no restart | `/plugin install sodam-agent@sodamagent-marketplace` → **restart**. Type `/sodam-agent:` with the colon |
| `marketplace add` says `Marketplace file not found` | The repo's **default branch has no marketplace file** | The publisher must set the **default branch to the marketplace branch** (done for this repo). Retry shortly |
| No `/plugin` command | Old Claude Code | **Update Claude Code** to the latest (docs: code.claude.com) |
| Pasting a path gives `Invalid ... format` | The path **includes quotes (")** | **Remove the quotes** — path only. Prefer a space-free folder |
| Marketplace added but `@team-name:` autocomplete shows **0 teammates** | You ran `marketplace add` but **not `install`** | Run `/plugin install <team>@sodamagent-marketplace` **separately** (adding ≠ installing) |
| macOS · Linux install? | Supported scope | SoDam-Agent is developed and verified **Windows-first**. On macOS/Linux, the `/plugin` commands work the same if Claude Code is installed, but path/environment differences may cause edge cases. Report issues at [GitHub Issues](https://github.com/sodam-ai/SoDam-Agent/issues). |
| Trained a team agent but it reverts | You **edited a team agent directly** (overwritten on update) | Use `/sodam-agent:pick-agent` to make a **copy**, then train the copy |
| Names like `web-app-team:` look confusing | — | That's expected. The **`team:role`** naming makes *your* installs unambiguous |
| context7 (doc search) errors | No Node.js / network blocked | Install **LTS** from [nodejs.org](https://nodejs.org) / try another network |
| `/doctor` shows a `context7 ... skipped` warning | Multiple teams bundle the same tool (context7); only one gets loaded | **This is normal** — the duplicate tool is deduped to one active copy, no functional impact |
| context7 shows a "failed to connect" warning (even while offline / behind a corporate network) | context7 is optional but always attempts to connect (a known minor issue) | **Safe to ignore** — core functionality is unaffected, and it reconnects automatically once you're back online |
| Install fails behind corporate proxy/firewall | Network blocked | Try another network / ask admin to unblock |
| (Method B) Windows "blocked this app" | SmartScreen / antivirus | Right-click the file → Properties → "Unblock" / add AV exception |
| MCP asks for an API key | Some tools need a key | Get a key from the provider → store it in an **OS environment variable** (never in files) |
| Want to use it on mobile | — | SoDam-Agent is **Claude Code (desktop/CLI) only**; standalone mobile use is not supported |

---

## 12. Safety & disclaimer

- **Removal is safe**: install/uninstall is handled by Claude Code's `/plugin` manager (easy to undo). Agent deletion goes through `.bak` backup + confirm.
- **Secrets are never stored in files**: MCP config and agent creation hold only the key *name*; the actual value stays in your OS environment variable.
- **A limit, honestly**: `sodam-agent`'s safeguards are **prompt-instruction based**, which is weaker than code-enforced. **Always check the preview** before important actions.
- This software is provided **"AS IS" with no warranty.** You are responsible for its use.
- Check the **pricing / terms / data policy of any external tools (MCP) / APIs** you install — yourself.

---

## 13. License · Copyright · Commercial use (important)

> ⚠️ **Read this first — this is not legal advice.** This section is a plain-language summary only; it does **not replace advice from a lawyer or legal professional.** If you intend to use this for a **commercial purpose** (business, sales, client delivery, etc.), treat everything below as reference information only and **get a professional review.** This tool is provided **"AS IS," with no warranty of any kind.**

- **License: Apache License 2.0.** Commercial use, modification, copying, and redistribution are **allowed**.
  - Conditions: keep `LICENSE`/copyright notices, **state changes**, **preserve `NOTICE`**, **no trademark grant**, **no warranty (AS IS)**. Full text: [`LICENSE`](./LICENSE) · [`NOTICE`](./NOTICE).
  - **Limitation of liability (plain-language)**: Under Apache-2.0 §8, the authors and contributors are **not liable, to the extent permitted by law**, for damages arising from use of this tool. The [`LICENSE`](./LICENSE) text itself is authoritative — not this summary.
- **Copyright**: © 2026 SoDam AI Studio.
- **Trademarks**: "Claude Code"·"Claude"·"Anthropic" are trademarks of Anthropic, PBC; "Codex"·"OpenAI" are trademarks of OpenAI; "Gemini"·"Gemini CLI"·"Google" are trademarks of Google; "Cursor" is a trademark of Cursor (Anysphere); "Context7"·"Upstash" are trademarks of their respective owners. **Any other product/service name mentioned in this document is also a trademark of its respective owner.** **SoDam-Agent is unofficial and not affiliated with, sponsored by, or endorsed by any of them.** Trademarks are used **nominatively** only (no logos). Also, whether the name **"SoDam-Agent"** itself is registrable as a trademark is undetermined — check for conflicts with same/similar names yourself.
- **Commercial scope**: under Apache-2.0, **modification, copying, forking, redistribution, selling, running as a service, training material, and client delivery** are mostly allowed. But **everything below is your responsibility.**
- **Your responsibility (must verify separately)**: the **pricing, terms of service, model-use policy, and data-handling policy of the MCPs (e.g., context7/Upstash) and external APIs** you install are **not guaranteed by SoDam-Agent** — verify them yourself before commercial use.
- **Preset / generated-content origin**: team agent instructions and the templates `sodam-agent` creates are **SoDam-Agent's own curation** (no third-party works bundled). However, some text may be **AI-generated**, and the copyright status of AI-generated content varies by jurisdiction and over time.

**✅ Final checklist before commercial use** (all items are yours to verify — SoDam-Agent does not guarantee any of them for you)
- [ ] I've read `LICENSE`/`NOTICE` and understand the conditions (keep notices, state changes, no trademark grant).
- [ ] I've verified the pricing/terms of any connected MCP (context7/Upstash, etc.) and external API directly on that service's own site.
- [ ] I've checked the copyright ownership, provenance, and possible infringement risk of AI-generated content (preset wording, etc.) — this varies by jurisdiction and over time.
- [ ] I've checked that the name "SoDam-Agent" doesn't conflict with an existing trademark in my region/industry.
- [ ] For anything I'm unsure about, I've had it reviewed by a **legal professional**.

---

## 14. Security & data flow

### Data collection
- **SoDam-Agent has no server.** This tool downloads files from a GitHub repository and registers them with Claude Code. That's it.
- **No user data is collected or transmitted.** Installation, agent creation, and command execution all happen entirely on your computer.

### Data flow (at a glance)
```
User input
  └─→ Claude Code
       └─→ Subagent (based on agent instruction file)
            └─→ (if tool needed) context7 MCP
                 └─→ Upstash (external doc DB) ← internet required
                      └─→ result returned
```

### API keys & secrets
- API keys, passwords, and tokens are **never stored in files.**
- Tool (MCP) configs and agent creation use only the key **name** (environment variable name).
- Store actual key values in **OS environment variables** (e.g., Windows System Environment Variables).

### Imported team-file safety (untrusted input by default)
When you `import` a team file (`*.agentroster.json`) made by someone else, these checks run before install:
- **Schema validation**: only the defined format/fields are allowed (unknown fields / format mismatch abort the install).
- **Size limit**: files over 256KB are rejected (flood/corruption guard).
- **Path-traversal block**: role/team names allow only lowercase letters, digits, and hyphens (no `../`).
- **Dangerous-command warning**: if a tool (MCP) command is a shell/interpreter like `bash`/`python`, a warning is shown.
- **Frontmatter-injection block**: a description/model value with a newline (used to smuggle a permission line) is rejected (hardened 2026-07-16).
- **Install preview + confirm**: you see what will be written where, and imported files never skip confirmation even with `--yes`.

### Self-protection hook
- A Claude Code hook blocks **accidental overwrites** of files inside `.claude-plugin/` folders.
- This prevents marketplace and plugin definition files from being modified unintentionally.

### context7 MCP behavior
- context7 MCP connects when `web-app-team` or `research-team` is installed.
- It runs **locally via `npx`** and fetches library documentation from Upstash (an external service).
- context7's pricing, terms, and data policy are managed by Upstash — **verify them yourself** at the Upstash site.

### Backup policy
- When an agent is deleted, an automatic `.bak` backup is created in the same folder.
- Backups are capped at 10 (oldest are auto-removed).

---

## 15. Architecture

### Repository structure
```
sodam-ai/SoDam-Agent (GitHub)
│
├── .claude-plugin/marketplace.json    ← marketplace catalog (plugin list)
│
├── plugins/
│   ├── web-app-team/
│   │   ├── .claude-plugin/plugin.json ← team metadata
│   │   ├── agents/
│   │   │   ├── planner.md             ← agent instructions (1 agent)
│   │   │   ├── frontend-dev.md
│   │   │   ├── backend-dev.md
│   │   │   └── reviewer.md
│   │   └── .mcp.json                  ← context7 MCP connection config
│   ├── docs-team/       (same structure)
│   ├── research-team/   (same structure)
│   ├── marketing-team/  (same structure)
│   ├── data-team/       (same structure)
│   ├── security-audit-team/  (same structure, no MCP)
│   ├── devops-team/          (same structure, no MCP)
│   ├── customer-support-team/  (same structure, no MCP)
│   ├── pm-team/                (same structure, no MCP)
│   ├── localization-team/      (same structure, no MCP)
│   └── sodam-agent/
│       └── commands/
│           ├── new-agent.md           ← slash command (1 command)
│           ├── training-agent.md
│           ├── save-agent.md
│           ├── pick-agent.md
│           └── remove-agent.md
│
├── src/                               ← Codex CLI only (unrelated to plugin install)
│   ├── presets.mjs                    ← team preset definitions
│   ├── install.mjs                    ← team install logic
│   ├── backup.mjs                     ← backup / restore
│   └── share.mjs                      ← team export
└── bin/cli.mjs                        ← Codex CLI entry point
```

### Install flow (plugin method)
```
1. /plugin marketplace add sodam-ai/SoDam-Agent
   → Registers the marketplace.json URL with Claude Code

2. /plugin install <team>@sodamagent-marketplace
   → Claude Code downloads plugin.json + agents/*.md from GitHub
   → Stores in ~/.claude/plugins/cache/

3. Restart Claude Code
   → Loads agent instruction files (.md) from cache
   → Registered under the scoped name "team:role" (shows in @ autocomplete)

4. User calls an agent
   → Claude Code runs that agent's instruction file as a subagent
```

### Core design principles
- **Serverless**: No dedicated SoDam-Agent server — runs entirely on GitHub + Claude Code
- **File-based agents**: Agent definitions are `.md` files (LLM-friendly, easy to version-control)
- **Zero external dependencies**: No npm packages required; Node.js 18+ only (for Codex CLI)
- **Least privilege**: Each agent has only the tools it needs

---

## 16. FAQ (frequently asked questions)

**Q. Is this tool free to use?**
> SoDam-Agent itself is **free** (Apache-2.0 open source). However, **Claude Code subscription fees** follow Anthropic's pricing, and **connected MCP services** (e.g., context7/Upstash) have their own pricing — check each service directly.

**Q. Which Claude plan do I need?**
> Plugin and subagent features are expected to work on **Pro or higher** plans, but this has not yet been verified through actual testing. Behavior on the Free plan is likewise unverified, and may vary depending on Anthropic's policies.

**Q. Can I use it offline?**
> The initial install requires an internet connection. After installing, the agents themselves work as long as the Claude API is reachable. However, **context7 MCP** (doc search) requires online access.

**Q. Do employee agents always use MCP tools like context7 directly?**
> Usually yes, but in real-world testing we've seen cases where an employee agent can't reach an MCP tool directly. When that happens, the **agent honestly says it can't access the tool, and the orchestrator (manager) looks it up instead and passes along the result** — instead of silently guessing, you always get an actual lookup result. Note that in this case the work was done by the manager, not the employee directly, so check the response for that indication.

**Q. How do I update?**
> Check for updates in the `/plugin` manager, or remove and re-add the marketplace to pull the latest version. Since agent files are overwritten on updates, **keep customized copies using `pick-agent`** before updating.

**Q. Can I create my own teams or agents?**
> Yes. Use the 5 `sodam-agent` commands to create and manage your own agents. To build a full team from scratch, see [DEVELOPMENT.md](./DEVELOPMENT.md) (`plugin.json` + `agents/*.md` format).

**Q. Is my data sent to a SoDam-Agent server?**
> No. SoDam-Agent has no separate server. All processing happens on your computer and inside Claude Code. (See [§14 Security & data flow](#14-security--data-flow).)

**Q. Is it Windows-only?**
> Windows is the primary development and testing platform. macOS/Linux users can use `/plugin`-based features with Claude Code, but some path/environment differences may occur. Report any issues via [GitHub Issues](https://github.com/sodam-ai/SoDam-Agent/issues).

**Q. Can I share the agents I create?**
> Yes. Use `/sodam-agent:save-agent` to save globally, then share the `~/.claude/agents/<name>.md` file. **Always check for personal info or API keys before sharing.**

**Q. Can I permanently change a team agent's instructions?**
> Team agent files are overwritten on updates if edited directly. The recommended approach: use `/sodam-agent:pick-agent` to copy it as your own agent, then modify with `/sodam-agent:training-agent`.

**Q. Is it OK if context7 is missing?**
> Perfectly fine. Without context7, AI agents can't look up live library docs, but all other functions work normally. Agents are usable even without Node.js or in offline environments.

---

## 17. Community Sharing Directory (optional)

The simplest way to browse teams other users have built, or share your own. **No server, no sign-up, no login** — just one catalog file in this GitHub repo and GitHub's own Pull Request feature.

- **Browse**: open [`community/index.json`](./community/index.json) to see the list of registered teams (name, description, source link).
- **Register**:
  1. Run `node bin/cli.mjs export <team-name>` to export your team as a file (`*.agentroster.json`).
  2. Upload that file to your own GitHub gist or repo (this repo does not store team files directly, to avoid accumulating files of unknown origin).
  3. Send a **Pull Request** adding a name/description/link to your gist or repo in `community/index.json`.
  4. The repo maintainer reviews and merges it.

> ⚠️ Files behind these links were still made by someone else — SoDam-Agent automatically runs schema validation and dangerous-command warnings when you install (import) a team, but **always double-check what you're installing.**

This is an early stage, so no teams are registered yet.

---

> 🇰🇷 [한국어](./README.md) · [Security & Data Flow](#14-security--data-flow) · [FAQ](#16-faq-frequently-asked-questions)
