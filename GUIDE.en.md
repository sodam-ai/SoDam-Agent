# SoDam-Agent — Beginner Guide (English)

[한국어 가이드](./GUIDE.md) · [README (reference)](./README.en.md)

> This guide is written so that **someone installing an AI / program for the very first time** can just follow along.
> Jargon is kept to a minimum, and any term is explained **in one line, right there**.

<details open>
<summary>📋 <b>Update summary</b> (as of 2026-07-16 — click to collapse)</summary>

- **2026-07-16**: Added the customer-support, PM/product-management, and localization teams — 10 teams complete. Hardened core backup/rollback files to write atomically (a mid-install crash can no longer leave a half-written file behind).
- **2026-07-13**: Reconfirmed all 7 teams in a completely separate, brand-new Claude Code session (reproducibility verified — not a fluke). Found and fixed a bug where the import feature's dangerous-command detector missed `.exe`-suffixed/uppercase commands. Ran a follow-up security review and re-confirmed safety via a live CLI run.
- **2026-07-12**: Confirmed all 7 teams install and respond correctly in a real Claude Code session (not a mockup). Found that `/reload-plugins` applies new plugins without a full restart, updated Step 5 accordingly. Fixed 3 minor bugs, ran a security review.
- **2026-07-11**: Added the security-audit team and devops team — 7 teams complete. Added Gemini CLI and Cursor role translation (beta).
- **2026-07-06**: Install safety/security hardening (forced confirmation when installing a team file from someone else, more reliable rollback if install is interrupted, stronger confirmation for global operations)
- **2026-07-04**: Fixed a tool-permission (allow/deny list) bug
- **2026-06-29**: Added the marketing team and data team — 5 teams complete
- **2026-06-21**: Introduced marketplace-based install + the agent-management tool (`sodam-agent`)

See the update summary in [README](./README.en.md) or the [GitHub commit log](https://github.com/sodam-ai/SoDam-Agent/commits/) for details.

</details>

---

## 0. First — what is this? (1 min)

- **Claude Code**: a program that lets you give tasks to an AI. Normally you talk to **one AI**.
- **SoDam-Agent**: a tool that adds **several AI teammates (a team)** to Claude Code at once, and lets you **create and train your own agents even after installing**.
  e.g., it "hires" a *planner · frontend developer · backend developer · reviewer* all together — and lets you *hire and train more*.
- What you'll do: type **a few commands** into Claude Code. That's it.

> 💡 **One-line glossary**
> - **Plugin**: a *part you snap into* a program. (SoDam-Agent is that part.)
> - **Marketplace**: a *store that collects parts*. Register it, then you can grab parts.
> - **Agent (subagent)**: one AI teammate.
> - **Input box**: the field at the bottom of Claude Code where you type.

> 📛 **Naming note**: the product is named **SoDam-Agent**. But the `@sodamagent-marketplace` after a team name in install commands is the *store's internal id* — the letters differ, but **type it as-is** (it's normal).

> 📋 **What does this version do? (as of 2026-07-16)**: You can install all 10 teams (web app · docs · research · marketing · data · security audit · devops · customer support · PM/product · localization) + the agent-management tool + Codex/Gemini CLI/Cursor role translation (beta). For the full change history, see the "Current version status" note at the top of [README.en.md](./README.en.md).

---

## 1. Get ready (just two things)

1. **Claude Code must be installed.** (If not, install it first: search "Claude Code" → official site claude.com/claude-code)
2. **An internet connection.**

> (Optional) To also use the *doc-search tool* of `web-app-team`·`research-team`, you need **Node.js**. Without it the teammates still work; only that tool is missing. If needed, get the "LTS" build from nodejs.org.

---

## 2. Install (follow along exactly)

> Type the text below into the **Claude Code "input box"**, not a black terminal.

### Step 1 · Open Claude Code
- Open it the way you normally do. (When you see the input box, you're ready.)

### Step 2 · Register the store (marketplace) — once only
👉 Type this **exactly** in the input box and press Enter:
```
/plugin marketplace add sodam-ai/SoDam-Agent
```
🖥️ Success when you see a "marketplace added" message.
> ⚠️ If it says `Marketplace file not found`: GitHub may need **1–2 minutes** to propagate. Wait a moment and try again.

### Step 3 · Install a team
👉 Type your chosen team and Enter (one is fine):
```
/plugin install web-app-team@sodamagent-marketplace
```
- Docs team: `/plugin install docs-team@sodamagent-marketplace`
- Research team: `/plugin install research-team@sodamagent-marketplace`
- Marketing team: `/plugin install marketing-team@sodamagent-marketplace`
- Data team: `/plugin install data-team@sodamagent-marketplace`
- Security audit team: `/plugin install security-audit-team@sodamagent-marketplace`
- DevOps/deployment team: `/plugin install devops-team@sodamagent-marketplace`
- Customer support team: `/plugin install customer-support-team@sodamagent-marketplace`
- PM/product management team: `/plugin install pm-team@sodamagent-marketplace`
- Translation/localization team: `/plugin install localization-team@sodamagent-marketplace`

### Step 4 · (Optional) Install the management tool
To **create and train your own agents**, also install:
```
/plugin install sodam-agent@sodamagent-marketplace
```

### Step 5 · ⭐ Load what you just installed — the most important step!
👉 **Type this first** (no full quit/reopen needed — confirmed to work by real testing):
```
/reload-plugins
```
> **Why?** Plugins are **loaded once at startup or reload**. So **before that**, the agents/commands you just installed **won't appear.** (This is the most common gotcha!)
> Still nothing? Type `/exit` to quit, then open `claude` again (or fully close and reopen the window).

---

## 3. Verify it worked

👉 Type and Enter:
```
/agents
```
🖥️ A list of AI teammates appears. Find a name like **`web-app-team:reviewer`**.
- The name starts with **`team:`** → *your installed teammates are clearly distinguishable*. (This is the key point!)
- If you see it, **success**. (Press **Esc** to exit the list.)

---

## 4. Give a teammate a task (example)

The easiest way is **plain language**. In the input box:
```
Ask web-app-team:reviewer to review this code
```
Or for a writing team:
```
Ask docs-team:editor to make this text smoother
```
🖥️ Claude calls that teammate (subagent), hands off the task, and brings back the result.

> 💡 Type `@` in the input box to **pick** a teammate from a list.

---

## 5. Create & train your own agents (sodam-agent tool)

If you installed `sodam-agent` in Step 4 and restarted, type `/sodam-agent:` to see these commands.

### ➕ Create a new agent
```
/sodam-agent:new-agent
```
🖥️ It asks for name·job·personality. Answer, and **your agent** is created. (e.g., "a friendly helper that explains things in Korean")

### 🎓 Train an agent
```
/sodam-agent:training-agent
```
🖥️ It edits the agent's **instructions** to change behavior. e.g., `Train the helper I just made to answer more briefly`
> **What is "training"?** Not re-training the AI — it **changes the instructions** you give the agent. (Like updating a note that says "from now on, do it this way.")

### 📋 Copy a team agent into yours
```
/sodam-agent:pick-agent
```
> **Why copy?** Team agents (`web-app-team:reviewer`, etc.) **can't be edited directly** (your edits vanish on update). So you make a **copy** and train that. (Like copying a library book into your own notebook to mark it up.)

### 💾 Save · 🗑️ Delete an agent
```
/sodam-agent:save-agent     ← save your agent so every project can use it
/sodam-agent:remove-agent   ← delete an agent (backs up first, then asks "delete for sure?")
```
> ⚠️ **Deletion caution**: the list may include agents **you actually use**. To practice, create a **throwaway** agent with `new-agent` and delete that one.

---

## 6. When you no longer need it (remove)

👉 Type and Enter:
```
/plugin
```
🖥️ Your installed plugins are listed. Select the team/tool and choose **uninstall**.
> Removal is handled safely by Claude Code — if you remove it by mistake, just install it again.

---

## 7. When you get stuck (common cases)

| If this happens | Why? | Do this |
|---|---|---|
| Installed but `/agents`·`/sodam-agent:` show **nobody** | You **didn't reload** | Try `/reload-plugins` first. Still missing? **Quit and reopen Claude Code** (`/exit` → `claude`) |
| `/sodam-agent` shows **unrelated stuff** (team-agents, etc.) | `sodam-agent` not installed or no restart | `/plugin install sodam-agent@sodamagent-marketplace` → **restart**. Type `/sodam-agent:` with the colon |
| `marketplace add` says "not found" | GitHub propagation delay / typo | Retry in **1–2 min**. Still failing? `/plugin marketplace remove sodam-ai` then add again |
| `/plugin` does nothing | Old Claude Code | **Update Claude Code** to the latest |
| Pasting a path gives an `Invalid ... format` error | The path **includes quotes (")** | **Remove the quotes** — path only. Use a space-free folder |
| Added but `/agents` shows **nobody** | You did `marketplace add` but **not `install`** | Run `/plugin install <team>@sodamagent-marketplace` **once more** |
| Trained a team agent but it reverted | You **edited a team agent directly** (overwritten on update) | Use `/sodam-agent:pick-agent` to make a **copy**, then train the copy |
| The doc-search tool errors | No Node.js / blocked internet | Install LTS from nodejs.org / try another network |
| Want to use it on a phone | — | This tool is **for Claude Code on a computer** (no standalone phone use) |
| Want to use it on macOS / Linux | — | The `/plugin` commands work the same on macOS/Linux with Claude Code installed. However, SoDam-Agent is **Windows-first** for development/testing — minor differences may occur. Report issues at [GitHub Issues](https://github.com/sodam-ai/SoDam-Agent/issues). |

---

## 8. Safety & cost (must know)

- **Safe to remove.** Install/uninstall is managed by Claude Code. Agent deletion also goes through backup + confirm.
- **Passwords/keys are not stored in files.** (Tool config & agent creation hold only the key *name*.)
- This tool is provided **"AS IS" with no warranty.** You are responsible for its use.
- For any external tool (e.g., context7 doc search) or service you install, **check its pricing/terms yourself.** (Most have a free tier, but policies can change.)

---

## 9. License (short)

- **Apache License 2.0** — commercial use, modification, copying, and redistribution allowed (keep copyright notices, state changes, preserve NOTICE). See `LICENSE`·`NOTICE`.
- "Claude Code"·"Anthropic"·"Codex"·"OpenAI"·"Gemini"·"Google"·"Cursor"·"Context7" etc. are their companies' names (trademarks); **SoDam-Agent is unofficial, not affiliated with, sponsored by, or endorsed by any of them.** Whether the name "SoDam-Agent" is registrable as a trademark is undetermined — verify before commercial use.
- Agent instructions/templates are **self-authored** and some text may be **AI-generated**. Review before sensitive commercial use.

---

## (Optional) Using it in Codex too — role translation (beta)

If you also use **Codex** (another AI coding tool), you can build the same team for Codex too.
> Honestly: Codex isn't a "several agents working separately as a team" style. So instead of the same team, it **"translates" each role into instructions Codex understands** (beta).

> ⚠️ This **one** thing needs a **black terminal** (unlike plugin install). Codex users are usually comfortable with a terminal.

**Prerequisites**: ① a downloaded copy of this project (see section 10) ② **Node.js** (LTS from nodejs.org)

**How** — from the downloaded SoDam-Agent folder, in a terminal, one line (put your Codex project folder in `--dir`):
```
node bin/cli.mjs install web-app-team --target codex --dir "C:\my_codex_project_folder"
```
🖥️ It previews what will be created and asks → say yes, and that folder gets **`AGENTS.md`** (role instructions) and `.agents/skills/...`.
- Swap the team for `docs-team`·`research-team`.
- If you need the doc-search tool (context7), paste the **few TOML lines shown into `~/.codex/config.toml` and restart Codex**.

**How to use**: open **Codex in that folder**; it reads `AGENTS.md` and works by the roles.
> If it doesn't work: make sure you opened Codex **in that folder** (elsewhere it can't read `AGENTS.md`). And Codex follows the roles as "instructions" — it's not several agents running at once (that's normal).

---

## (Optional) Using it in Gemini CLI too — role translation (beta)

If you also use **Gemini CLI** (Google's AI coding tool), you can build the same team for it too.
> Honestly: Gemini CLI uses a different tool-name scheme than Claude Code (e.g. `read_file` vs `Read`). Mapping them without a verified table risks breaking things, so this version generates roles with **full tool inheritance, no restrictions** (beta).

> ⚠️ This **one** thing needs a **black terminal** (unlike plugin install), same as Codex.

**Prerequisites**: ① a downloaded copy of this project (see section 10) ② **Node.js** (LTS from nodejs.org)

**How** — from the downloaded SoDam-Agent folder, in a terminal, one line (put your Gemini CLI project folder in `--dir`):
```
node bin/cli.mjs install web-app-team --target gemini --dir "C:\my_gemini_project_folder"
```
🖥️ It previews what will be created and asks → say yes, and that folder gets **`.gemini/agents/<role>.md`** files (one per role).
- Swap the team for `docs-team`·`research-team`.
- If you need the doc-search tool (context7), paste the **mcpServers snippet shown at install into whichever role file you want**.

**How to use**: open **Gemini CLI in that folder**; it recognizes the roles under `.gemini/agents/` as subagents.
> If it doesn't work: make sure you opened Gemini CLI **in that folder** (elsewhere it can't read them). Tools/permissions being wide open is expected — this version doesn't add restrictions (beta limitation).

---

## (Optional) Using it in Cursor too — role translation (beta)

If you also use **Cursor** (another AI coding editor), you can build the same team for it too.
> Honestly: Cursor's rules (`.cursor/rules`) aren't a "call this employee" concept. So like Codex, this **"translates" each role into a description inside `AGENTS.md`** rather than the same team (beta).

> ⚠️ This **one** thing needs a **black terminal** (unlike plugin install), same as Codex and Gemini CLI.

**Prerequisites**: ① a downloaded copy of this project (see section 10) ② **Node.js** (LTS from nodejs.org)

**How** — from the downloaded SoDam-Agent folder, in a terminal, one line (put your Cursor project folder in `--dir`):
```
node bin/cli.mjs install web-app-team --target cursor --dir "C:\my_cursor_project_folder"
```
🖥️ It previews what will be created and asks → say yes, and that folder gets **`AGENTS.md`** (role descriptions), and **`.cursor/mcp.json` gets the doc-search (context7) tool connected automatically** (unlike Codex/Gemini, no manual pasting needed).
- Swap the team for `docs-team`·`research-team`.

**How to use**: open **Cursor in that folder**; it reads `AGENTS.md` and refers to the role descriptions.
> If it doesn't work: make sure you opened Cursor **in that folder** (elsewhere it can't read `AGENTS.md`). Cursor's rules are reference-only — unlike Claude Code, you don't call/summon an employee (that's normal).

---

## 10. (Advanced) Instead of the marketplace — run it from your folder

You can **register a downloaded folder as a "store"** (inside Claude Code, no terminal).
1. Download this project (ZIP from GitHub → unzip).
2. In the Claude Code **input box** (⚠️ **no quotes**, a space-free path):
   ```
   /plugin marketplace add C:\downloaded-folder\SoDam-Agent
   ```
3. Then install teams/tool — **skip this and you'll see no teammates**:
   ```
   /plugin install web-app-team@sodamagent-marketplace
   /plugin install sodam-agent@sodamagent-marketplace
   ```
4. **Restart** to apply. The rest is the same as **Steps 3·4·5** above.
> 💡 If you prefer a terminal: `claude --plugin-dir "downloaded-folder\plugins\web-app-team"` also works.

---

## 11. Frequently asked questions (FAQ)

| Question | Answer |
|---|---|
| **Is SoDam-Agent free?** | SoDam-Agent is free (Apache-2.0). Claude Code subscription and connected tools (e.g., context7) have their own pricing — check each service. |
| **Which Claude plan do I need?** | Pro or higher is recommended (expected, not yet verified). Free plan behavior is unverified. |
| **Can I use it offline?** | Install needs internet. After that, agents work with a Claude API connection. context7 doc-search needs internet. |
| **Do employees always use MCP (e.g. context7) directly?** | Usually, but real-world testing shows an employee may not have direct access. When that happens, it says so honestly and the manager looks it up instead — results stay accurate, but the response shows who actually did the work. |
| **How do I update?** | In `/plugin` manager, or remove and re-add the marketplace. Keep custom copies with `pick-agent` before updating. |
| **Is my data sent anywhere?** | No. SoDam-Agent has no server. Everything runs on your computer. |
| **Can I make my own team?** | Yes. Use the 5 `sodam-agent` commands for your own agents. To build a full team, see [DEVELOPMENT.md](./DEVELOPMENT.md). |
| **What if context7 is missing?** | Agents still work — only live library doc lookup is unavailable. |
| **`/doctor` shows `context7 skipped` — is that OK?** | Yes. Multiple teams bundle the same tool; only one gets activated. No functional impact. |
| **Can I share my agents?** | Yes — share the `.md` file. Check for personal info or API keys first. |

---

> Full reference: [README.en.md](./README.en.md) · 🇰🇷 [한국어 가이드](./GUIDE.md) · [FAQ & Architecture →](./README.en.md#16-faq-frequently-asked-questions)
