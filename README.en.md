# AgentRoster

[한국어](./README.md) | **English** · [Beginner Guide (GUIDE)](./GUIDE.en.md)

> A **beginner-friendly** tool that adds **role-based AI teammate teams** (planner, developer, reviewer, …) to Claude Code with **a single plugin install**.
> No hand-editing config files — **two commands** inside Claude Code and your team is ready.
> This is an **installer tool** for teams. It does **not** run the agents for you.

---

## 📑 Table of Contents
1. [What is AgentRoster? (in plain words)](#1-what-is-agentroster-in-plain-words)
2. [Prerequisites & required programs](#2-prerequisites--required-programs)
3. [Download & install](#3-download--install)
4. [Quick start (3 steps)](#4-quick-start-3-steps)
5. [Installable teams (3)](#5-installable-teams-3)
6. [How to use it](#6-how-to-use-it)
7. [Command reference](#7-command-reference)
8. [Workflow](#8-workflow-at-a-glance)
9. [File & document locations](#9-file--document-locations)
10. [Troubleshooting](#10-troubleshooting-symptom--cause--fix)
11. [Safety & disclaimer](#11-safety--disclaimer)
12. [License · Copyright · Commercial use](#12-license--copyright--commercial-use-important)

---

## 1. What is AgentRoster? (in plain words)

Claude Code lets you give tasks to an AI — usually you talk to **one AI**.
**AgentRoster** adds **several AI teammates (subagents) as a "team set"** to Claude Code at once.

- Analogy: it "hires" *role-based teammates* — **planner · frontend-dev · backend-dev · reviewer** — for your previously solo AI, all in one go.
- You **never** create files or edit config by hand. Just pick a team.

> In one line: **"A tool that installs AI teammate teams into Claude Code in a few clicks."**

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
**Two commands** inside Claude Code. No terminal, no folder navigation, no "open in the right folder" hassle.

1. **Open Claude Code.**
2. **Add the marketplace** (one time only):
   ```
   /plugin marketplace add sodam-ai/AgentRoster
   ```
3. **Install the team you want:**
   ```
   /plugin install web-app-team@agentroster
   ```
   - Other teams: `docs-team@agentroster` · `research-team@agentroster`

> ⚠️ **Important (current status)**: the marketplace commands above work **after the plugin is on the repository's default branch (i.e., after publishing/merge)**. If it isn't ready yet, use **Method B** first.

### Method B — Run locally from a download (preview / development)
1. Get this repository (`git clone` or download the ZIP from GitHub and unzip).
2. In a terminal, launch Claude Code pointing at the team folder:
   ```
   claude --plugin-dir "<downloaded folder>/plugins/web-app-team"
   ```
   - Multiple teams at once: repeat `--plugin-dir ...docs-team --plugin-dir ...research-team`.

---

## 4. Quick start (3 steps)

1. In Claude Code: `/plugin marketplace add sodam-ai/AgentRoster` (once).
2. `/plugin install web-app-team@agentroster`.
3. Open `/agents` — if you see a name like **`web-app-team:reviewer`**, you're done → use it: `Have web-app-team:reviewer review this code`.

> Expected time: **about 2–3 minutes.**

---

## 5. Installable teams (3)

| Team (install name) | Name | AI teammates (roles) | Bundled tool (MCP) |
|---|---|---|---|
| `web-app-team` | Web App Build Team | planner · frontend-dev · backend-dev · reviewer | context7 (library-docs search) |
| `docs-team` | Docs / Content Team | writer · editor · fact-checker | none |
| `research-team` | Research Team | researcher · analyst · critic | context7 |

> Each teammate gets **least-privilege tools** (e.g., the reviewer is read-only). Model is `inherit` (follows your default model).

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

> 💡 Plugins are visible in **every folder and every session** right away — no need to launch Claude in a specific folder.

---

## 7. Command reference

> All commands below are typed in the **Claude Code input box** (not a black terminal).

| Command | What it does |
|---|---|
| `/plugin marketplace add sodam-ai/AgentRoster` | Register the AgentRoster marketplace (first time) |
| `/plugin install web-app-team@agentroster` | Install the web app team (swap the team name for others) |
| `/plugin` | Plugin manager (installed list · uninstall · enable/disable) |
| `/agents` | View/manage installed AI teammates |
| `/reload-plugins` | (Method B, during dev) reload after editing files |

---

## 8. Workflow at a glance

```
Add marketplace (once) → Install a team (/plugin install) → Verify with /agents (team:role)
   → Call a teammate (natural language / @) → Remove via /plugin (uninstall) when done
```

---

## 9. File & document locations

- **Installed plugin cache** (managed automatically by Claude Code): `~/.claude/plugins/cache/`
- **This repository's structure**:
  - `.claude-plugin/marketplace.json` — marketplace catalog (the 3 teams)
  - `plugins/<team>/.claude-plugin/plugin.json` — team metadata
  - `plugins/<team>/agents/<role>.md` — one AI teammate (description + instructions)
  - `plugins/<team>/.mcp.json` — the team's tool (MCP) config (web-app · research)
- **Docs**: `README.md` (KO) · `README.en.md` (EN, this file) · `GUIDE.md` (KO beginner) · `GUIDE.en.md` (EN) · `docs/*.pdf` (PDF copies) · `LICENSE` · `NOTICE`

---

## 10. Troubleshooting (symptom → cause → fix)

| Symptom | Cause | Fix |
|---|---|---|
| No `/plugin` command | Old Claude Code | **Update Claude Code** to the latest (docs: code.claude.com) |
| `marketplace add` fails | Not yet on the default branch / typo | Retry **after publish (merge)**, or use **Method B** (local `--plugin-dir`) |
| Installed but no teammates in `/agents` | Not loaded yet | Type `/reload-plugins`; if still missing, **restart Claude Code** |
| Names like `web-app-team:` look confusing | — | That's expected. The **`team:role`** naming makes *your* installs unambiguous |
| context7 (doc search) errors | No Node.js / network blocked | Install **LTS** from [nodejs.org](https://nodejs.org) / try another network |
| Install fails behind corporate proxy/firewall | Network blocked | Try another network / ask admin to unblock |
| (Method B) Windows "blocked this app" | SmartScreen / antivirus | Right-click the file → Properties → "Unblock" / add AV exception |
| (Method B) Garbled text on non-ASCII path | Path encoding | Keep files on an ASCII, space-free path |
| Want to remove it | — | `/plugin` → select the plugin → **uninstall** |
| Claude Code doesn't know the teammate | Claude Code missing/outdated | Install/update and retry |
| MCP asks for an API key | Some tools need a key | Get a key from the provider → store it in an **OS environment variable** (never in files) |
| Want to use it on mobile | — | AgentRoster is **Claude Code (desktop/CLI) only**; standalone mobile use is not supported |

---

## 11. Safety & disclaimer

- **Removal is safe**: install/uninstall is handled by Claude Code's `/plugin` manager (easy to undo).
- **Secrets are never stored in files**: MCP config holds only the key *name*; the actual value stays in your OS environment variable.
- This software is provided **"AS IS" with no warranty.** You are responsible for its use.
- Check the **pricing / terms / data policy of any external tools (MCP) / APIs** you install — yourself.

---

## 12. License · Copyright · Commercial use (important)

- **License: Apache License 2.0.** Commercial use, modification, copying, and redistribution are **allowed**.
  - Conditions: keep `LICENSE`/copyright notices, **state changes**, **preserve `NOTICE`**, **no trademark grant**, **no warranty (AS IS)**. Full text: [`LICENSE`](./LICENSE) · [`NOTICE`](./NOTICE).
- **Copyright**: © 2026 SoDam AI Studio. *(Exact legal entity name to be finalized.)*
- **Trademarks**: "Claude Code", "Claude", "Anthropic" are trademarks of Anthropic; "Context7"·"Upstash" are trademarks of their owners. **AgentRoster is unofficial and not affiliated with or endorsed by any of them.** Trademarks are used **nominatively** only (no logos).
- **Commercial scope**: under Apache-2.0, **modification, copying, forking, redistribution, selling, running as a service, training material, and client delivery** are mostly allowed. But **the following is your responsibility.**
- **Your responsibility (must verify separately)**: the **pricing, terms of service, model-use policy, and data-handling policy of the MCPs (e.g., context7/Upstash) and external APIs** you install are **not guaranteed by AgentRoster** — verify them yourself before commercial use.
- **Preset (teammate instructions) origin**: authored as **AgentRoster's own curation** (no third-party works bundled). Some text may be AI-generated; review before sensitive commercial use.

---

> 📘 Easier walkthrough: [Beginner Guide (GUIDE.en.md)](./GUIDE.en.md) · 🇰🇷 [한국어](./README.md) · 📄 PDF: `docs/` folder
