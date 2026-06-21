# AgentRoster — Beginner Guide (English)

[한국어 가이드](./GUIDE.md) · [README (reference)](./README.en.md)

> This guide is written so that **someone installing an AI / program for the very first time** can just follow along.
> Jargon is kept to a minimum, and any term is explained **in one line, right there**.

---

## 0. First — what is this? (1 min)

- **Claude Code**: a program that lets you give tasks to an AI. Normally you talk to **one AI**.
- **AgentRoster**: a tool that adds **several AI teammates (a team)** to Claude Code at once.
  e.g., it "hires" a *planner · frontend developer · backend developer · reviewer* all together.
- What you'll do: type **two commands** into Claude Code. That's it.

> 💡 **One-line glossary**
> - **Plugin**: a *part you snap into* a program. (AgentRoster is that part.)
> - **Marketplace**: a *store that collects parts*. Register it, then you can grab parts.
> - **Agent (subagent)**: one AI teammate.
> - **Input box**: the field at the bottom of Claude Code where you type.

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
/plugin marketplace add sodam-ai/AgentRoster
```
🖥️ Success when you see a "marketplace added" message.
> ⚠️ If it *fails* or says *not found*: it may not be published yet. In that case see **"Advanced: run from a download"** at the bottom.

### Step 3 · Install a team
👉 Type your chosen team and Enter (one is fine):
```
/plugin install web-app-team@agentroster
```
- Docs team: `/plugin install docs-team@agentroster`
- Research team: `/plugin install research-team@agentroster`

🖥️ Done when you see an "installed" message!

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

## 5. When you no longer need it (remove)

👉 Type and Enter:
```
/plugin
```
🖥️ Your installed plugins are listed. Select the team and choose **uninstall**.
> Removal is handled safely by Claude Code — if you remove it by mistake, just install it again.

---

## 6. When you get stuck (common cases)

| If this happens | Why? | Do this |
|---|---|---|
| `/plugin` does nothing | Old Claude Code | **Update Claude Code** to the latest |
| `marketplace add` won't work | Not published yet, or typo | Retry after it's published / use "Advanced" below |
| Pasting a path gives an `Invalid ... format` error | The path **includes quotes (")** | **Remove the quotes** — path only. Use a space-free folder |
| Added but `/agents` shows **nobody** | You did `marketplace add` but **not `install`** | Run `/plugin install <team>@agentroster` **once more** |
| Installed but nothing in `/agents` | Not loaded yet | Type `/reload-plugins` → still missing? **Restart Claude Code** |
| The doc-search tool errors | No Node.js / blocked internet | Install LTS from nodejs.org / try another network |
| Install fails on work network | Firewall / proxy | Try another network (e.g., home) |
| Want to use it on a phone | — | This tool is **for Claude Code on a computer** (no standalone phone use) |

---

## 7. Safety & cost (must know)

- **Safe to remove.** Install/uninstall is managed by Claude Code.
- **Passwords/keys are not stored in files.** (Tool config holds only the key *name*.)
- This tool is provided **"AS IS" with no warranty.** You are responsible for its use.
- For any external tool (e.g., context7 doc search) or service you install, **check its pricing/terms yourself.** (Most have a free tier, but policies can change.)

---

## 8. License (short)

- **Apache License 2.0** — commercial use, modification, copying, and redistribution allowed (keep copyright notices, state changes, preserve NOTICE). See `LICENSE`·`NOTICE`.
- "Claude Code/Anthropic/Context7" etc. are their companies' names (trademarks); **AgentRoster is unofficial and not affiliated.**

---

## 9. (Advanced) When the marketplace isn't ready — try it from your folder

Even before publish, you can **register the downloaded folder as a "store"** (inside Claude Code, no terminal).
1. Download this project (ZIP from GitHub → unzip).
2. In the Claude Code **input box** (⚠️ **no quotes**, a space-free path):
   ```
   /plugin marketplace add C:\downloaded-folder\AgentRoster
   ```
3. Then install a team — **skip this and you'll see no teammates**:
   ```
   /plugin install web-app-team@agentroster
   ```
4. The rest is the same as **Steps 3·4 (verify·use)** above.
> 💡 If you prefer a terminal: `claude --plugin-dir "downloaded-folder\plugins\web-app-team"` also works.

---

> Full reference: [README.en.md](./README.en.md) · 🇰🇷 [한국어 가이드](./GUIDE.md)
