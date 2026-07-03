# SoDam-Agent

[한국어](./README.md) | **English** · [Beginner Guide (GUIDE)](./GUIDE.en.md)

> A **beginner-friendly** tool that adds **role-based AI teammate teams** (planner, developer, reviewer, …) to Claude Code with **a single plugin install** — and lets you **create, train, and manage your own agents even after installing**.
> No hand-editing config files — **a few commands** inside Claude Code and you're set.
> This is an **installer tool** for teams. It does **not** run the agents for you.

> 📛 **Naming note (so you don't get confused)**
> - **Product / repository name = `SoDam-Agent`** (marketplace address: `sodam-ai/SoDam-Agent`)
> - **The `@sodamagent-marketplace` in install commands = the marketplace's internal id.** The letters differ from the product name, but that's **normal** — just type it as-is.

---

## 📑 Table of Contents
1. [What is SoDam-Agent? (in plain words)](#1-what-is-sodam-agent-in-plain-words)
2. [Prerequisites & required programs](#2-prerequisites--required-programs)
3. [Download & install](#3-download--install)
4. [Quick start (3 steps)](#4-quick-start-3-steps)
5. [What you can install (5 teams + management tool)](#5-what-you-can-install-5-teams--management-tool)
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
- ✨ [Using it in Codex too (role translation · beta)](#using-it-in-codex-too-role-translation--beta)

---

## 1. What is SoDam-Agent? (in plain words)

Claude Code lets you give tasks to an AI — usually you talk to **one AI**.
**SoDam-Agent** adds **several AI teammates (subagents) as a "team set"** to Claude Code at once. And **even after installing**, you can **create new agents yourself** and **train them** to behave the way you want.

- Analogy: it "hires" *role-based teammates* — **planner · frontend-dev · backend-dev · reviewer** — for your previously solo AI, and lets you *hire and train more* as needed.
- You **never** create files or edit config by hand. Just pick from menus/commands.

> In one line: **"A tool that installs AI teammate teams into Claude Code, and lets you create and train your own."**

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
5. **Restart Claude Code (quit and reopen).**
   - ⚠️ **The most common gotcha**: right after install, `/agents`·`/sodam-agent:` may **not appear** — plugins are **loaded once when Claude Code starts**. **Restart and they show up.**

> 💡 `@sodamagent-marketplace` is the marketplace's internal id — type it as-is (it's fine that it differs from the product name SoDam-Agent).

### Method B — Run it from your own folder (inside Claude Code, no terminal)
Instead of the online marketplace, you can **register a downloaded folder as a "store."**
1. Get this repository (`git clone` or download the ZIP from GitHub and unzip).
2. In the Claude Code **input box** (⚠️ **no quotes**, prefer a space-free path):
   ```
   /plugin marketplace add C:\downloaded-folder\SoDam-Agent
   ```
3. Then install teams/tool (skip this and `/agents` will be empty):
   ```
   /plugin install web-app-team@sodamagent-marketplace
   /plugin install sodam-agent@sodamagent-marketplace
   ```
4. **Restart** to apply.
> 💡 If you prefer a terminal: `claude --plugin-dir "<downloaded folder>\plugins\web-app-team"` also works (repeat `--plugin-dir` for multiple teams).

---

## 4. Quick start (3 steps)

1. In Claude Code: `/plugin marketplace add sodam-ai/SoDam-Agent` (once).
2. `/plugin install web-app-team@sodamagent-marketplace` → **restart**.
3. Open `/agents` — if you see a name like **`web-app-team:reviewer`**, you're done → use it: `Have web-app-team:reviewer review this code`.

> Expected time: **about 2–3 minutes.** (To also create/train agents, install `sodam-agent` in step 4 above.)

---

## 5. What you can install (5 teams + management tool)

**① Team plugins (bundles of AI teammates)**

| Team (install name) | Name | AI teammates (roles) | Bundled tool (MCP) |
|---|---|---|---|
| `web-app-team` | Web App Build Team | planner · frontend-dev · backend-dev · reviewer | context7 (library-docs search) |
| `docs-team` | Docs / Content Team | writer · editor · fact-checker | none |
| `research-team` | Research Team | researcher · analyst · critic | context7 |
| `marketing-team` | Marketing Team | copywriter (copy & content) · seo-analyst (SEO) · social-manager (social media) | none |
| `data-team` | Data Team | data-engineer (collect & clean) · data-analyst (analysis) · data-viz (visualization) | none |

> Each teammate gets **least-privilege tools** (e.g., the reviewer is read-only). Model is `inherit` (follows your default model).

**② Management tool plugin (`sodam-agent`)** — after installing teams, this is the **command set to create and train your own agents**. See [section 7](#7-manage-your-own-agents-after-install-sodam-agent).

---

## 6. How to use it

After installing, teammates are registered as **`team:role`** (e.g., `web-app-team:reviewer`).

- **Verify**: type `/agents` → in the list (Library tab) check that `web-app-team:reviewer` etc. appear.
  - The `team:` prefix makes them **unambiguous** versus similarly named agents from elsewhere.
- **How to call one (pick whichever is easiest):**
  1. Natural language: `Ask web-app-team:reviewer to review this code`
  2. Explicit (@-mention): type `@` in the input → pick from the list.
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

## 7. Manage your own agents after install (sodam-agent)

With `sodam-agent` installed, you can create and manage agents **inside Claude Code with slash commands** — no terminal. (Claude Code's native `/agents` "Create" is hard for beginners to find, so this replaces it with **one command**.)

> Type `/sodam-agent:` to narrow to the 5 commands below. (Don't see them? → **restart**.)

| Command | What it does | One-line note |
|---|---|---|
| `/sodam-agent:new-agent` | **Create a new agent** | Asks name·job·personality, then creates your agent (`.claude/agents/`). |
| `/sodam-agent:training-agent` | **Train an agent** | Edits the agent's instructions to change its behavior. *(read "What is training?" below)* |
| `/sodam-agent:save-agent` | **Save / reuse an agent** | Saves your agent globally (usable in every project) or backs it up. |
| `/sodam-agent:pick-agent` | **Copy a team agent to yours** | Copies a team agent into your own agents. |
| `/sodam-agent:remove-agent` | **Delete an agent** | Safely deletes your agent (`.bak` backup + "delete for sure?" confirm). |

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
| `/agents` | View/manage installed AI teammates |
| `/sodam-agent:new-agent` | Create a new agent |
| `/sodam-agent:training-agent` | Train an agent |
| `/sodam-agent:save-agent` | Save / reuse an agent |
| `/sodam-agent:pick-agent` | Copy a team agent into yours |
| `/sodam-agent:remove-agent` | Delete an agent (backup + confirm) |
| `/reload-plugins` | (Method B, during dev) reload after editing files |

---

## 9. Workflow at a glance

```
Add marketplace (once) → Install teams/tool (/plugin install) → Restart
   → Verify with /agents (team:role)
   → Call a teammate (natural language / @)
   → (optional) /sodam-agent:new-agent to create → training-agent to teach
   → Remove via /sodam-agent:remove-agent or /plugin when done
```

---

## 10. File & document locations

- **Installed plugin cache** (managed automatically by Claude Code): `~/.claude/plugins/cache/`
- **Agents you create**: `<project>/.claude/agents/<name>.md` (global save: `~/.claude/agents/`)
- **This repository's structure**:
  - `.claude-plugin/marketplace.json` — marketplace catalog (6 teams, all registered)
  - `plugins/<team>/.claude-plugin/plugin.json` — team metadata
  - `plugins/<team>/agents/<role>.md` — one AI teammate (description + instructions)
  - `plugins/<team>/.mcp.json` — the team's tool (MCP) config (web-app · research)
  - `plugins/sodam-agent/commands/*.md` — the 5 agent-management commands
- **Docs**: `README.md` (KO) · `README.en.md` (EN, this file) · `GUIDE.md` (KO beginner) · `GUIDE.en.md` (EN) · `docs/*.pdf` (PDF copies) · `LICENSE` · `NOTICE`

---

## 11. Troubleshooting (symptom → cause → fix)

| Symptom | Cause | Fix |
|---|---|---|
| Installed but `/agents`·`/sodam-agent:` show **nothing** | **No restart** (plugins load at startup) | **Quit and reopen Claude Code**. Still missing? `/reload-plugins` |
| `/sodam-agent` shows **unrelated stuff** (team-agents, etc.) | `sodam-agent` not installed or no restart | `/plugin install sodam-agent@sodamagent-marketplace` → **restart**. Type `/sodam-agent:` with the colon |
| `marketplace add` says `Marketplace file not found` | The repo's **default branch has no marketplace file** | The publisher must set the **default branch to the marketplace branch** (done for this repo). Retry shortly |
| No `/plugin` command | Old Claude Code | **Update Claude Code** to the latest (docs: code.claude.com) |
| Pasting a path gives `Invalid ... format` | The path **includes quotes (")** | **Remove the quotes** — path only. Prefer a space-free folder |
| Marketplace added but `/agents` shows **0 teammates** | You ran `marketplace add` but **not `install`** | Run `/plugin install <team>@sodamagent-marketplace` **separately** (adding ≠ installing) |
| macOS · Linux install? | Supported scope | SoDam-Agent is developed and verified **Windows-first**. On macOS/Linux, the `/plugin` commands work the same if Claude Code is installed, but path/environment differences may cause edge cases. Report issues at [GitHub Issues](https://github.com/sodam-ai/SoDam-Agent/issues). |
| Trained a team agent but it reverts | You **edited a team agent directly** (overwritten on update) | Use `/sodam-agent:pick-agent` to make a **copy**, then train the copy |
| Names like `web-app-team:` look confusing | — | That's expected. The **`team:role`** naming makes *your* installs unambiguous |
| context7 (doc search) errors | No Node.js / network blocked | Install **LTS** from [nodejs.org](https://nodejs.org) / try another network |
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

- **License: Apache License 2.0.** Commercial use, modification, copying, and redistribution are **allowed**.
  - Conditions: keep `LICENSE`/copyright notices, **state changes**, **preserve `NOTICE`**, **no trademark grant**, **no warranty (AS IS)**. Full text: [`LICENSE`](./LICENSE) · [`NOTICE`](./NOTICE).
- **Copyright**: © 2026 SoDam AI Studio. *(Exact legal entity name to be finalized.)*
- **Trademarks**: "Claude Code", "Claude", "Anthropic" are trademarks of Anthropic; "Context7"·"Upstash" are trademarks of their owners. **SoDam-Agent is unofficial and not affiliated with or endorsed by any of them.** Trademarks are used **nominatively** only (no logos). Also, whether the name **"SoDam-Agent"** itself is registrable as a trademark is undetermined — check for conflicts with same/similar names yourself.
- **Commercial scope**: under Apache-2.0, **modification, copying, forking, redistribution, selling, running as a service, training material, and client delivery** are mostly allowed. But **the following is your responsibility.**
- **Your responsibility (must verify separately)**: the **pricing, terms of service, model-use policy, and data-handling policy of the MCPs (e.g., context7/Upstash) and external APIs** you install are **not guaranteed by SoDam-Agent** — verify them yourself before commercial use.
- **Preset / generated-content origin**: team agent instructions and the templates `sodam-agent` creates are **SoDam-Agent's own curation** (no third-party works bundled). Some text may be **AI-generated**; review before sensitive commercial use.

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
   → Registers as "team:role" in /agents

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

> 📘 Easier walkthrough: [Beginner Guide (GUIDE.en.md)](./GUIDE.en.md) · 🇰🇷 [한국어](./README.md) · 📄 PDF: `docs/` folder · [Security & Data Flow](#14-security--data-flow) · [FAQ](#16-faq-frequently-asked-questions)
