# SoDam-Agent

**한국어** | [English](./README.en.md) · [왕초보 가이드(GUIDE)](./GUIDE.md)

> Claude Code에 **역할별 AI 직원 팀**(기획자·개발자·검토자 등)을 **플러그인 한 번 설치**로 붙이고,
> **설치한 뒤에도 내 직원을 직접 만들고·가르치고·관리**할 수 있는 **비개발자용** 도구입니다.
> 어려운 설정 파일을 손댈 필요 없이, Claude Code 안에서 **명령 몇 줄**이면 됩니다.
> 이 도구는 팀을 **깔아 주는 설치 도구**입니다. 에이전트를 대신 **실행해 주는 도구가 아닙니다.**

> 📛 **이름 안내(헷갈리지 않게)**
> - **제품·저장소 이름 = `SoDam-Agent`** (마켓 등록 주소: `sodam-ai/SoDam-Agent`)
> - **설치 명령에 붙는 `@sodamagent-marketplace` = 마켓(가게)의 내부 식별자**입니다. 제품명과 글자가 다르지만 **정상**이며, **그대로 입력**하시면 됩니다.

---

## 📑 목차
1. [SoDam-Agent란? (아주 쉽게)](#1-sodam-agent란-아주-쉽게)
2. [사전 준비물 · 필요 프로그램](#2-사전-준비물--필요-프로그램)
3. [다운로드 · 설치 방법](#3-다운로드--설치-방법)
4. [빠른 시작 (3단계)](#4-빠른-시작-3단계)
5. [설치할 수 있는 것 (팀 3종 + 관리 도구)](#5-설치할-수-있는-것-팀-3종--관리-도구)
6. [사용 · 작동 방법](#6-사용--작동-방법)
7. [설치 후 내 직원 직접 관리하기 (sodam-agent)](#7-설치-후-내-직원-직접-관리하기-sodam-agent)
8. [명령어 모음](#8-명령어-모음)
9. [워크플로우](#9-워크플로우-한눈에)
10. [파일 · 문서 위치](#10-파일--문서-위치)
11. [문제 · 오류 대처](#11-문제--오류-대처-증상--원인--해결)
12. [안전 · 면책](#12-안전--면책)
13. [라이선스 · 저작권 · 상업적 사용](#13-라이선스--저작권--상업적-사용-중요)
- ✨ [Codex에서도 쓰기 (역할 번역 · 베타)](#codex에서도-쓰기-역할-번역--베타)

---

## 1. SoDam-Agent란? (아주 쉽게)

Claude Code는 AI에게 일을 시키는 도구입니다. 보통은 **AI 한 명**과 대화하죠.
**SoDam-Agent**는 그 Claude Code에 **여러 명의 AI 직원(=서브에이전트)을 "팀 세트"로** 한 번에 붙여 줍니다. 그리고 **설치한 뒤에도** 내가 원하는 **새 직원을 직접 만들고**, 그 직원을 **내 입맛대로 가르칠** 수 있습니다.

- 비유: 혼자 일하던 AI에게 **기획자 · 화면개발자 · 서버개발자 · 코드검토자** 같은 *역할별 직원들*을 한꺼번에 채용해 주고, 필요하면 **새 직원을 더 뽑고 교육**하는 것.
- 직접 파일을 만들거나 설정을 편집할 필요가 **전혀 없습니다.** 메뉴·명령으로 고르면 끝.

> 한 줄: **"AI 직원 팀을 Claude Code에 클릭 몇 번으로 깔고, 직원을 직접 만들고 가르치는 도구."**

---

## 2. 사전 준비물 · 필요 프로그램

| 준비물 | 필요한가? | 설명 |
|---|---|---|
| **Claude Code** | ✅ 필수 | AI 직원들은 Claude Code "안에서" 쓰입니다. ([공식 사이트](https://claude.com/claude-code)에서 설치) |
| **인터넷 연결** | ✅ 필수 | 플러그인을 받아오고, 일부 도구(MCP)를 내려받습니다. |
| **Node.js 18 이상** | 🟡 선택(권장) | `web-app-team`·`research-team`이 쓰는 자료검색 도구(**context7 MCP**)가 `npx`(=Node)로 동작합니다. Node가 없으면 **AI 직원은 그대로 쓰되 그 도구만 빠집니다.** 없으면 [nodejs.org](https://nodejs.org)에서 **LTS** 설치. |

> 확인법(선택): 검은 명령창에 `node -v` 입력 → `v20.x` 처럼 숫자가 나오면 Node 준비됨.

---

## 3. 다운로드 · 설치 방법

설치는 두 가지입니다. **대부분은 방법 A(마켓플레이스)** 면 됩니다.

### ⭐ 방법 A — 마켓플레이스에서 설치 (추천 · 가장 쉬움)
Claude Code 안에서 **명령 몇 줄**이면 끝납니다. 터미널·폴더 이동이 **전혀 필요 없습니다.**

1. **Claude Code를 켭니다.**
2. **마켓플레이스 등록** (맨 처음 딱 한 번):
   ```
   /plugin marketplace add sodam-ai/SoDam-Agent
   ```
   🖥️ "마켓플레이스가 추가되었다"는 안내가 나오면 성공.
3. **원하는 팀을 설치:**
   ```
   /plugin install web-app-team@sodamagent-marketplace
   ```
   - 다른 팀: `docs-team@sodamagent-marketplace` · `research-team@sodamagent-marketplace`
4. **(선택) 직원 관리 도구도 설치** — 새 직원을 직접 만들고 가르치고 싶다면:
   ```
   /plugin install sodam-agent@sodamagent-marketplace
   ```
5. **Claude Code를 껐다 켭니다(재시작).**
   - ⚠️ **가장 흔한 막힘 지점**: 설치 직후엔 `/agents`·`/sodam-agent:`가 **안 보일 수 있습니다.** 플러그인은 **켤 때 한 번 로드**되기 때문입니다. **재시작하면 보입니다.**

> 💡 `@sodamagent-marketplace`는 마켓의 내부 식별자라 그대로 입력하면 됩니다(제품명 SoDam-Agent와 글자가 달라도 정상).

### 방법 B — 내 컴퓨터 폴더로 써 보기 (클로드 안에서 · 검은창 불필요)
인터넷 마켓 대신, **내려받은 폴더를 직접 "가게"로 등록**해도 됩니다.
1. 이 저장소를 내려받습니다(`git clone` 또는 GitHub에서 ZIP 다운로드 → 압축 해제).
2. Claude Code **입력창**에 (⚠️ **따옴표 없이**, 공백·한글 없는 경로 권장):
   ```
   /plugin marketplace add C:\내려받은폴더\SoDam-Agent
   ```
3. 이어서 팀·도구를 설치합니다(이 단계를 빠뜨리면 직원이 안 보입니다):
   ```
   /plugin install web-app-team@sodamagent-marketplace
   /plugin install sodam-agent@sodamagent-marketplace
   ```
4. **재시작**하면 적용됩니다.
> 💡 검은 터미널이 익숙하면: `claude --plugin-dir "<내려받은 폴더>\plugins\web-app-team"` 로 켤 수도 있습니다(여러 팀은 `--plugin-dir` 반복).

---

## 4. 빠른 시작 (3단계)

1. Claude Code에서 `/plugin marketplace add sodam-ai/SoDam-Agent` (한 번만).
2. `/plugin install web-app-team@sodamagent-marketplace` → **재시작**.
3. `/agents` 를 열어 **`web-app-team:reviewer`** 같은 이름이 보이면 성공 → 바로 `web-app-team:reviewer 서브에이전트로 이 코드 검토해줘` 처럼 사용.

> 예상 소요: **약 2~3분.** (직원 만들기·가르치기까지 쓰려면 4번에서 `sodam-agent`도 설치)

---

## 5. 설치할 수 있는 것 (팀 3종 + 관리 도구)

**① 팀 플러그인 (AI 직원 묶음)**

| 팀 (설치 이름) | 한국어 이름 | AI 직원(역할) | 함께 붙는 도구(MCP) |
|---|---|---|---|
| `web-app-team` | 웹앱 빌드팀 | planner(기획) · frontend-dev(화면) · backend-dev(서버) · reviewer(검토) | context7(라이브러리 문서 검색) |
| `docs-team` | 문서/콘텐츠팀 | writer(초안) · editor(다듬기) · fact-checker(사실확인) | 없음 |
| `research-team` | 리서치팀 | researcher(수집) · analyst(분석) · critic(반박검증) | context7 |

> 각 직원은 **최소한의 권한(tools)** 만 가집니다(예: 검토자는 읽기 전용). 모델은 `inherit`(사용자님이 쓰는 기본 모델을 따름).

**② 관리 도구 플러그인 (`sodam-agent`)** — 팀을 깐 뒤, **새 직원을 직접 만들고 가르치는** 명령 모음입니다. 자세한 사용은 [7번](#7-설치-후-내-직원-직접-관리하기-sodam-agent) 참고.

---

## 6. 사용 · 작동 방법

설치하면 AI 직원들이 **`팀이름:역할`** 형태로 등록됩니다 (예: `web-app-team:reviewer`).

- **확인**: `/agents` 입력 → 목록(특히 Library 탭)에서 `web-app-team:reviewer` 등이 보이는지 확인.
  - 이름에 `팀:` 이 붙어 있어, 다른 데서 온 비슷한 이름과 **확실히 구분**됩니다.
- **부르는 법(셋 중 편한 것):**
  1. 자연어: `web-app-team:reviewer 한테 이 코드 검토 맡겨줘`
  2. 직접 지정(@-mention): 입력창에 `@` 입력 → 목록에서 선택.
  3. 자동: 작업 성격에 맞으면 Claude가 알아서 해당 직원에게 맡기기도 합니다.
- **도구(MCP)**: `web-app-team`·`research-team`을 설치하면 **context7(자료 검색) 도구가 함께 연결**됩니다(별도 설정 불필요).

> 💡 플러그인은 **모든 폴더·모든 세션에서 바로** 보입니다(재시작 1회 후). 특정 폴더에서 Claude를 켜야 하는 번거로움이 없습니다.

---

## Codex에서도 쓰기 (역할 번역 · 베타)

Claude Code뿐 아니라 **Codex(다른 AI 코딩 도구)** 에서도 같은 팀을 쓸 수 있습니다.
단, **정직하게 말씀드립니다**: Codex에는 Claude Code 같은 *"여러 직원이 따로 도는 팀"* 개념이 없습니다.
그래서 **"똑같은 팀"이 아니라, 각 역할을 Codex 방식(지침서 + 스킬)으로 "번역"** 해 드립니다(베타).

> ⚠️ 이 기능**만**은 **검은 터미널이 필요**합니다(플러그인 설치와 달리). Codex를 쓰시는 분은 보통 터미널에 익숙하니 괜찮습니다.

**준비물**
- 이 저장소를 내려받은 폴더 (위 [3번 방법 B](#3-다운로드--설치-방법)처럼 GitHub ZIP 다운로드 또는 `git clone`)
- **Node.js 18+** (CLI 실행에 필요 — [nodejs.org](https://nodejs.org) LTS)

**설치 방법** — 내려받은 SoDam-Agent 폴더에서, Codex로 작업할 프로젝트 폴더를 대상으로:
```
node bin/cli.mjs install web-app-team --target codex --dir "C:\내\프로젝트\폴더"
```
- `--dir` 를 빼면 **현재 폴더**에 만듭니다. · 다른 팀은 `docs-team`·`research-team` 으로 바꿉니다.
- 실행하면 **무엇이 만들어질지 미리보기**를 보여주고 확인을 받습니다(`--yes` 로 확인 건너뛰기 가능).

**무엇이 만들어지나 (파일 위치)**

| 파일 | 위치 | 역할 |
|---|---|---|
| `AGENTS.md` | 프로젝트 폴더 루트 | Codex가 시작할 때 읽는 **역할 지침서**(역할 = "모드") |
| `SKILL.md` | `.agents/skills/<역할>/SKILL.md` | 역할별 상세 지시문 |
| MCP 설정(TOML) | `~/.codex/config.toml` | 자료검색(context7) 같은 도구. **자동으로 안 건드립니다** — 설치 때 나온 TOML을 직접 붙여넣기 |

> 기존에 `AGENTS.md`가 있으면 **`AGENTS.md.bak`으로 백업**한 뒤 새로 씁니다(안전).

**쓰는 법**
- 그 폴더에서 **Codex를 실행**하면 `AGENTS.md`를 읽고 역할 지침을 적용합니다.
- 자료검색(context7)이 필요하면, 설치 때 화면에 나온 **TOML 조각을 `~/.codex/config.toml`에 붙여넣고 Codex 재시작**.

**문제 대처**

| 증상 | 해결 |
|---|---|
| Codex가 역할을 안 따름 | **그 폴더에서** Codex를 실행했는지 확인(다른 폴더면 `AGENTS.md`를 못 읽음) |
| 자료검색 도구가 없음 | TOML을 `~/.codex/config.toml`에 추가 후 **Codex 재시작** / Node.js 설치 확인 |
| "똑같은 팀"처럼 병렬 협업이 안 됨 | 정상입니다 — Codex는 역할을 **지침**으로 따릅니다(병렬 팀 아님) |

> 🔎 실제 Codex 런타임에서의 인식은 사용자 환경에서 한 번 확인해 보시길 권합니다(도구·버전에 따라 다를 수 있음).

---

## 7. 설치 후 내 직원 직접 관리하기 (sodam-agent)

`sodam-agent` 도구를 설치하면, **검은 터미널 없이 Claude Code 안에서** 슬래시 명령으로 직원을 직접 만들고 관리할 수 있습니다. (Claude Code 기본 `/agents`의 "Create"가 비개발자에겐 찾기 어려워, **명령 한 줄**로 대체한 것.)

> 명령은 `/sodam-agent:` 까지 입력하면 아래 5개가 추려져 보입니다. (안 보이면 → **재시작**)

| 명령 | 하는 일 | 한 줄 설명 |
|---|---|---|
| `/sodam-agent:new-agent` | **새 직원 만들기** | 이름·하는 일·성격을 물어보고, 내 직원(`.claude/agents/`)으로 만들어 줍니다. |
| `/sodam-agent:training-agent` | **직원 가르치기(특훈)** | 직원의 지시서를 고쳐 행동을 바꿉니다. *(아래 "학습이란?" 꼭 읽기)* |
| `/sodam-agent:save-agent` | **직원 저장·재사용** | 만든 직원을 **모든 프로젝트에서** 쓰도록 전역으로 저장하거나 백업합니다. |
| `/sodam-agent:pick-agent` | **직원 골라오기** | 팀 직원을 본떠 **내 직원으로 복사**해 옵니다. |
| `/sodam-agent:remove-agent` | **직원 삭제** | 내 직원을 안전하게 지웁니다(`.bak` 백업 + "정말 지울까요?" 확인). |

### 🎓 "학습/가르치기"란? (정직한 설명)
- 여기서 말하는 **학습은 AI를 다시 훈련시키는 게 아닙니다.** 직원의 **지시서(시스템 프롬프트)를 고쳐** 행동을 바꾸는 것입니다. (예: "검토자야, 앞으로 **보안 위주로** 봐줘")
- **내가 만든 직원** → `training-agent`로 **바로** 고칩니다(가장 쉬움).
- **팀 직원**(`web-app-team:reviewer` 등) → **직접 고칠 수 없습니다.** 플러그인 업데이트 때 내 수정이 사라지기 때문입니다. 대신 `pick-agent`로 **복사본을 만든 뒤** 그 복사본을 가르칩니다. (도서관 책에 낙서 대신, 내 공책에 옮겨 적어 고치는 것과 같아요.)

### 🔒 만들 때의 안전장치
- 이름은 **안전한 글자만**(영문·숫자·하이픈) 허용 → 엉뚱한 경로 조작 차단.
- **비밀번호·API 키를 직접 적지 않습니다**(필요하면 환경변수 "이름"만).
- 바꾸기 전 **미리보기**를 보여주고, 삭제는 **백업 + 확인**을 거칩니다.

---

## 8. 명령어 모음

> 아래 명령은 모두 **Claude Code 입력창**에 칩니다(검은 터미널 아님).

| 명령 | 하는 일 |
|---|---|
| `/plugin marketplace add sodam-ai/SoDam-Agent` | SoDam-Agent 마켓플레이스 등록(처음 한 번) |
| `/plugin install web-app-team@sodamagent-marketplace` | 웹앱팀 설치 (팀 이름만 바꾸면 다른 팀) |
| `/plugin install sodam-agent@sodamagent-marketplace` | 직원 관리 도구 설치 |
| `/plugin` | 플러그인 관리 화면(설치 목록·제거·켜고 끄기) |
| `/agents` | 설치된 AI 직원 목록 보기·관리 |
| `/sodam-agent:new-agent` | 새 직원 만들기 |
| `/sodam-agent:training-agent` | 직원 가르치기 |
| `/sodam-agent:save-agent` | 직원 저장·재사용 |
| `/sodam-agent:pick-agent` | 팀 직원을 내 직원으로 복사 |
| `/sodam-agent:remove-agent` | 직원 삭제(백업+확인) |
| `/reload-plugins` | (방법 B 개발 중) 파일 수정 후 다시 불러오기 |

---

## 9. 워크플로우 (한눈에)

```
마켓플레이스 등록(1회) → 팀·도구 설치(/plugin install) → 재시작
   → /agents로 확인(팀:역할)
   → 직원 부르기(자연어/@)
   → (원하면) /sodam-agent:new-agent 로 새 직원 만들기 → training-agent 로 가르치기
   → 필요 없으면 /sodam-agent:remove-agent 또는 /plugin 에서 제거
```

---

## 10. 파일 · 문서 위치

- **설치된 플러그인 캐시**(Claude Code가 자동 관리): `~/.claude/plugins/cache/`
- **내가 만든 직원**: `<프로젝트>/.claude/agents/<이름>.md` (전역 저장 시 `~/.claude/agents/`)
- **이 저장소 구조**:
  - `.claude-plugin/marketplace.json` — 마켓플레이스 카탈로그(팀 3종 + 관리 도구)
  - `plugins/<팀>/.claude-plugin/plugin.json` — 팀 정보
  - `plugins/<팀>/agents/<역할>.md` — AI 직원 한 명(설명+지시문)
  - `plugins/<팀>/.mcp.json` — 그 팀이 쓰는 도구(MCP) 설정 (web-app·research)
  - `plugins/sodam-agent/commands/*.md` — 직원 관리 명령 5종
- **문서**: `README.md`(한·이 문서) · `README.en.md`(영) · `GUIDE.md`(한 왕초보) · `GUIDE.en.md`(영) · `docs/*.pdf`(PDF 사본) · `LICENSE` · `NOTICE`

---

## 11. 문제 · 오류 대처 (증상 → 원인 → 해결)

| 증상 | 원인 | 해결 |
|---|---|---|
| 설치했는데 `/agents`·`/sodam-agent:`에 **아무것도 안 보임** | **재시작을 안 함** (플러그인은 켤 때 로드) | **Claude Code를 껐다 켜기**. 그래도 없으면 `/reload-plugins` |
| `/sodam-agent` 쳤더니 **엉뚱한 팀(team-agents 등)만** 뜸 | `sodam-agent` 미설치 또는 미재시작 | `/plugin install sodam-agent@sodamagent-marketplace` → **재시작** |
| `marketplace add`가 `Marketplace file not found` | 저장소 **기본 브랜치에 마켓 파일이 없음** | 게시자가 **기본 브랜치를 마켓 브랜치로** 설정해야 함(이 저장소는 설정 완료). 잠시 후 재시도 |
| `/plugin` 명령이 없음 | Claude Code 구버전 | Claude Code를 **최신으로 업데이트**(문서: code.claude.com) |
| 경로를 넣었더니 `Invalid ... format` | 경로에 **따옴표(")가 포함**됨 | 따옴표를 **빼고** 경로만 입력. 공백·한글 없는 폴더 권장 |
| 마켓은 등록됐는데 `/agents`에 직원이 **0명** | `marketplace add`만 하고 **`install`을 안 함** | `/plugin install <팀>@sodamagent-marketplace` 를 **따로** 실행 (등록 ≠ 설치) |
| 팀 직원을 가르쳤는데 다음에 사라짐 | **팀 직원을 직접 수정**함(업데이트 시 덮어써짐) | `/sodam-agent:pick-agent` 로 **복사본**을 만들어 그걸 가르치기 |
| `web-app-team:` 같은 이름이 헷갈림 | — | 그게 정상입니다. **`팀:역할`** 이름이라 내가 깐 게 확실히 구분됩니다 |
| context7(자료검색) 도구가 에러 | Node.js 없음 / 네트워크 차단 | [nodejs.org](https://nodejs.org)에서 **LTS** 설치 / 다른 네트워크 |
| 회사 프록시·방화벽으로 설치 실패 | 네트워크 차단 | 다른 네트워크에서 시도 / 관리자에게 차단 해제 요청 |
| (방법 B) Windows가 "차단했습니다" | SmartScreen·백신 | 내려받은 파일 우클릭 → 속성 → "차단 해제" / 백신 예외 |
| MCP가 API 키를 요구함 | 일부 도구는 키 필요 | 해당 제공처에서 키 발급 → **OS 환경변수**에 저장(파일에 직접 넣지 마세요) |
| 모바일에서 쓰고 싶음 | — | SoDam-Agent는 **Claude Code(데스크톱/CLI) 전용**입니다. 모바일 단독 사용은 지원하지 않습니다 |

---

## 12. 안전 · 면책

- **제거가 안전합니다**: 설치/제거는 Claude Code의 `/plugin` 관리자가 직접 처리합니다(되돌리기 쉬움). 직원 삭제는 `.bak` 백업 + 확인을 거칩니다.
- **비밀은 파일에 저장하지 않습니다**: 도구(MCP) 설정·직원 만들기에는 **키 "이름"만** 들어가고, 실제 키 값은 사용자 OS 환경변수에 둡니다.
- **직원 관리의 한계(정직)**: `sodam-agent`의 안전장치는 **명령 지시문에 따른 것**이라, 코드로 강제하는 것보다는 약합니다. 중요한 작업 전 **미리보기를 꼭 확인**하세요.
- 이 도구는 **있는 그대로(AS IS)** 제공되며 **보증하지 않습니다.** 사용 책임은 사용자에게 있습니다.
- 설치하는 외부 도구(MCP)·API의 **요금·약관·데이터 정책은 사용자가 직접 확인**하세요.

---

## 13. 라이선스 · 저작권 · 상업적 사용 (중요)

- **라이선스: Apache License 2.0.** 상업적 사용·수정·복제·재배포가 **허용**됩니다.
  - 조건: `LICENSE`·저작권 고지 **유지**, **변경 사실 표시**, `NOTICE` **보존**, **상표권은 부여되지 않음**, **보증 없음(AS IS)**. 전문은 [`LICENSE`](./LICENSE)·[`NOTICE`](./NOTICE).
- **저작권**: © 2026 SoDam AI Studio. *(정확한 법적 주체명은 확정 전 — 표기 예정.)*
- **상표**: "Claude Code", "Claude", "Anthropic"은 Anthropic의, "Context7"·"Upstash"는 각 사의 상표입니다. **SoDam-Agent는 비공식이며 어느 회사와도 제휴/보증 관계가 아닙니다.** 상표는 **사실적 언급(nominative)** 으로만 사용합니다(로고 미사용). 또한 제품명 **"SoDam-Agent"** 자체의 상표 등록 여부는 확정 전이므로, 동일·유사 명칭과의 충돌 가능성은 사용자가 별도 확인하세요.
- **상업적 사용 범위**: Apache-2.0에 따라 **수정·복제·포크·재배포·판매·서비스 운영·교육 자료·회사/고객사 납품**이 대부분 허용됩니다. 단 **아래는 사용자 책임**입니다.
- **사용자 책임(반드시 별도 확인)**: 설치하는 **MCP(예: context7/Upstash)·외부 API의 요금제·이용약관·모델 사용 정책·데이터 처리 정책**은 SoDam-Agent가 보장하지 않으며, 상업적 사용 전 **사용자가 직접 확인**해야 합니다.
- **프리셋·생성물 출처**: 팀 직원의 지시문과 `sodam-agent`가 만드는 직원 템플릿은 **SoDam-Agent 자체 큐레이션**입니다(타인 저작물 미차용). 일부 문구가 **AI 생성**일 수 있으므로, 민감한 상업적 사용 전에는 **검토를 권장**합니다.

---

> 📘 더 쉬운 따라하기: [왕초보 가이드(GUIDE.md)](./GUIDE.md) · 🇺🇸 [English](./README.en.md) · 📄 PDF: `docs/` 폴더
