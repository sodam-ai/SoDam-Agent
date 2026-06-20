# AgentRoster

**한국어** | [English](./README.en.md) · [왕초보 가이드(GUIDE)](./GUIDE.md)

> Claude Code에 **역할별 AI 직원 팀**(기획자·개발자·검토자 등)을 **플러그인 한 번 설치**로 붙여 주는, **비개발자용** 도구입니다.
> 어려운 설정 파일을 손댈 필요 없이, Claude Code 안에서 **명령 두 줄**이면 팀이 생깁니다.
> 이 도구는 팀을 **깔아 주는 설치 도구**입니다. 에이전트를 대신 **실행해 주는 도구가 아닙니다.**

---

## 📑 목차
1. [AgentRoster란? (아주 쉽게)](#1-agentroster란-아주-쉽게)
2. [사전 준비물 · 필요 프로그램](#2-사전-준비물--필요-프로그램)
3. [다운로드 · 설치 방법](#3-다운로드--설치-방법)
4. [빠른 시작 (3단계)](#4-빠른-시작-3단계)
5. [설치할 수 있는 팀 (3종)](#5-설치할-수-있는-팀-3종)
6. [사용 · 작동 방법](#6-사용--작동-방법)
7. [명령어 모음](#7-명령어-모음)
8. [워크플로우](#8-워크플로우-한눈에)
9. [파일 · 문서 위치](#9-파일--문서-위치)
10. [문제 · 오류 대처](#10-문제--오류-대처-증상--원인--해결)
11. [안전 · 면책](#11-안전--면책)
12. [라이선스 · 저작권 · 상업적 사용](#12-라이선스--저작권--상업적-사용-중요)

---

## 1. AgentRoster란? (아주 쉽게)

Claude Code는 AI에게 일을 시키는 도구입니다. 보통은 **AI 한 명**과 대화하죠.
**AgentRoster**는 그 Claude Code에 **여러 명의 AI 직원(=서브에이전트)을 "팀 세트"로** 한 번에 붙여 줍니다.

- 비유: 혼자 일하던 AI에게 **기획자 · 화면개발자 · 서버개발자 · 코드검토자** 같은 *역할별 직원들*을 한꺼번에 채용해 주는 것.
- 직접 파일을 만들거나 설정을 편집할 필요가 **전혀 없습니다.** 메뉴에서 팀만 고르면 끝.

> 한 줄: **"AI 직원 팀을 Claude Code에 클릭 몇 번으로 깔아 주는 도구."**

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
Claude Code 안에서 **명령 두 줄**이면 끝납니다. 터미널·폴더 이동·재시작 폴더 맞추기가 **전혀 필요 없습니다.**

1. **Claude Code를 켭니다.**
2. **마켓플레이스 등록** (맨 처음 딱 한 번):
   ```
   /plugin marketplace add sodam-ai/AgentRoster
   ```
3. **원하는 팀 설치:**
   ```
   /plugin install web-app-team@agentroster
   ```
   - 다른 팀: `docs-team@agentroster` · `research-team@agentroster`

> ⚠️ **중요(현재 상태)**: 위 마켓플레이스 명령은 저장소의 **기본 브랜치에 플러그인이 올라간 뒤(공개 후)** 동작합니다. 아직 준비 중이라면 **방법 B**로 먼저 써 보세요.

### 방법 B — 내려받아 로컬에서 (미리보기 · 개발용)
1. 이 저장소를 내려받습니다(`git clone` 또는 GitHub에서 ZIP 다운로드 → 압축 해제).
2. 검은 명령창에서 원하는 팀 폴더를 지정해 Claude Code를 켭니다:
   ```
   claude --plugin-dir "<내려받은 폴더>/plugins/web-app-team"
   ```
   - 여러 팀 동시: `--plugin-dir ...docs-team --plugin-dir ...research-team` 처럼 반복.

---

## 4. 빠른 시작 (3단계)

1. Claude Code에서 `/plugin marketplace add sodam-ai/AgentRoster` (한 번만).
2. `/plugin install web-app-team@agentroster`.
3. `/agents` 를 열어 **`web-app-team:reviewer`** 같은 이름이 보이면 성공 → 바로 `web-app-team:reviewer 서브에이전트로 이 코드 검토해줘` 처럼 사용.

> 예상 소요: **약 2~3분.**

---

## 5. 설치할 수 있는 팀 (3종)

| 팀 (설치 이름) | 한국어 이름 | AI 직원(역할) | 함께 붙는 도구(MCP) |
|---|---|---|---|
| `web-app-team` | 웹앱 빌드팀 | planner(기획) · frontend-dev(화면) · backend-dev(서버) · reviewer(검토) | context7(라이브러리 문서 검색) |
| `docs-team` | 문서/콘텐츠팀 | writer(초안) · editor(다듬기) · fact-checker(사실확인) | 없음 |
| `research-team` | 리서치팀 | researcher(수집) · analyst(분석) · critic(반박검증) | context7 |

> 각 직원은 **최소한의 권한(tools)** 만 가집니다(예: 검토자는 읽기 전용). 모델은 `inherit`(사용자님이 쓰는 기본 모델을 따름).

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

> 💡 플러그인은 **모든 폴더·모든 세션에서 바로** 보입니다. 특정 폴더에서 Claude를 켜야 하는 번거로움이 없습니다.

---

## 7. 명령어 모음

> 아래 명령은 모두 **Claude Code 입력창**에 칩니다(검은 터미널 아님).

| 명령 | 하는 일 |
|---|---|
| `/plugin marketplace add sodam-ai/AgentRoster` | AgentRoster 마켓플레이스 등록(처음 한 번) |
| `/plugin install web-app-team@agentroster` | 웹앱팀 설치 (팀 이름만 바꾸면 다른 팀) |
| `/plugin` | 플러그인 관리 화면(설치 목록·제거·켜고 끄기) |
| `/agents` | 설치된 AI 직원 목록 보기·관리 |
| `/reload-plugins` | (방법 B 개발 중) 파일 수정 후 다시 불러오기 |

---

## 8. 워크플로우 (한눈에)

```
마켓플레이스 등록(1회) → 팀 설치(/plugin install) → /agents로 확인(팀:역할)
   → 직원 부르기(자연어/@) → 필요 없으면 /plugin 에서 제거(uninstall)
```

---

## 9. 파일 · 문서 위치

- **설치된 플러그인 캐시**(Claude Code가 자동 관리): `~/.claude/plugins/cache/`
- **이 저장소 구조**:
  - `.claude-plugin/marketplace.json` — 마켓플레이스 카탈로그(팀 3종 목록)
  - `plugins/<팀>/.claude-plugin/plugin.json` — 팀 정보
  - `plugins/<팀>/agents/<역할>.md` — AI 직원 한 명(설명+지시문)
  - `plugins/<팀>/.mcp.json` — 그 팀이 쓰는 도구(MCP) 설정 (web-app·research)
- **문서**: `README.md`(한·이 문서) · `README.en.md`(영) · `GUIDE.md`(한 왕초보) · `GUIDE.en.md`(영) · `docs/*.pdf`(PDF 사본) · `LICENSE` · `NOTICE`

---

## 10. 문제 · 오류 대처 (증상 → 원인 → 해결)

| 증상 | 원인 | 해결 |
|---|---|---|
| `/plugin` 명령이 없음 | Claude Code 구버전 | Claude Code를 **최신으로 업데이트**(문서: code.claude.com) |
| `marketplace add` 가 실패/안 됨 | 기본 브랜치에 아직 안 올라옴 / 주소 오타 | **공개(병합) 후** 재시도, 또는 **방법 B**(로컬 `--plugin-dir`) |
| 설치했는데 `/agents`에 직원이 안 보임 | 반영 전 | `/reload-plugins` 입력, 그래도 없으면 **Claude Code 재시작** |
| `web-app-team:` 같은 이름이 헷갈림 | — | 그게 정상입니다. **`팀:역할`** 이름이라 내가 깐 게 확실히 구분됩니다 |
| context7(자료검색) 도구가 에러 | Node.js 없음 / 네트워크 차단 | [nodejs.org](https://nodejs.org)에서 **LTS** 설치 / 다른 네트워크 |
| 회사 프록시·방화벽으로 설치 실패 | 네트워크 차단 | 다른 네트워크에서 시도 / 관리자에게 차단 해제 요청 |
| (방법 B) Windows가 "차단했습니다" | SmartScreen·백신 | 내려받은 파일 우클릭 → 속성 → "차단 해제" / 백신 예외 |
| (방법 B) 한글·공백 경로에서 깨짐 | 경로 인코딩 | 영문·공백 없는 경로에 두기 |
| 제거하고 싶음 | — | `/plugin` → 해당 플러그인 선택 → **uninstall** |
| Claude Code가 직원을 모름 | Claude Code 미설치/구버전 | 설치·업데이트 후 재시도 |
| MCP가 API 키를 요구함 | 일부 도구는 키 필요 | 해당 제공처에서 키 발급 → **OS 환경변수**에 저장(파일에 직접 넣지 마세요) |
| 모바일에서 쓰고 싶음 | — | AgentRoster는 **Claude Code(데스크톱/CLI) 전용**입니다. 모바일 단독 사용은 지원하지 않습니다 |

---

## 11. 안전 · 면책

- **제거가 안전합니다**: 설치/제거는 Claude Code의 `/plugin` 관리자가 직접 처리합니다(되돌리기 쉬움).
- **비밀은 파일에 저장하지 않습니다**: 도구(MCP) 설정에는 **키 "이름"만** 들어가고, 실제 키 값은 사용자 OS 환경변수에 둡니다.
- 이 도구는 **있는 그대로(AS IS)** 제공되며 **보증하지 않습니다.** 사용 책임은 사용자에게 있습니다.
- 설치하는 외부 도구(MCP)·API의 **요금·약관·데이터 정책은 사용자가 직접 확인**하세요.

---

## 12. 라이선스 · 저작권 · 상업적 사용 (중요)

- **라이선스: Apache License 2.0.** 상업적 사용·수정·복제·재배포가 **허용**됩니다.
  - 조건: `LICENSE`·저작권 고지 **유지**, **변경 사실 표시**, `NOTICE` **보존**, **상표권은 부여되지 않음**, **보증 없음(AS IS)**. 전문은 [`LICENSE`](./LICENSE)·[`NOTICE`](./NOTICE).
- **저작권**: © 2026 SoDam AI Studio. *(정확한 법적 주체명은 확정 전 — 표기 예정.)*
- **상표**: "Claude Code", "Claude", "Anthropic"은 Anthropic의, "Context7"·"Upstash"는 각 사의 상표입니다. **AgentRoster는 비공식이며 어느 회사와도 제휴/보증 관계가 아닙니다.** 상표는 **사실적 언급(nominative)** 으로만 사용합니다(로고 미사용).
- **상업적 사용 범위**: Apache-2.0에 따라 **수정·복제·포크·재배포·판매·서비스 운영·교육 자료·회사/고객사 납품**이 대부분 허용됩니다. 단 **아래는 사용자 책임**입니다.
- **사용자 책임(반드시 별도 확인)**: 설치하는 **MCP(예: context7/Upstash)·외부 API의 요금제·이용약관·모델 사용 정책·데이터 처리 정책**은 AgentRoster가 보장하지 않으며, 상업적 사용 전 **사용자가 직접 확인**해야 합니다.
- **프리셋(직원 지시문) 출처**: AgentRoster **자체 큐레이션**으로 작성했습니다(타인 저작물 미차용). 일부 문구가 AI 생성일 수 있으므로, 민감한 상업적 사용 전에는 검토를 권장합니다.

---

> 📘 더 쉬운 따라하기: [왕초보 가이드(GUIDE.md)](./GUIDE.md) · 🇺🇸 [English](./README.en.md) · 📄 PDF: `docs/` 폴더
