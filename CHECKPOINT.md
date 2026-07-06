# SoDam-Agent — 마일스톤 체크포인트

> 다음 세션은 이 파일부터 읽으면 됩니다. 상세 배경은 `.PRD/03_PHASES.md`(로컬 전용, git 추적 안 됨)를 참고하세요.

## 지금까지 완료된 것 (Phase 1 + Phase 2)

- **Phase 1(MVP)**: 프리셋 5종(웹앱·문서·리서치·마케팅·데이터) + 관리도구(`sodam-agent`) 6개 플러그인, 백업/되돌리기, doctor 진단, 대화형 메뉴, 보안 기본기(경로차단·명령미리보기·비밀금지) — 전부 구현·e2e 28건 검증.
- **Phase 2**: Codex 역할 번역(베타), 팀 export/import(공유) — 구현·검증 완료.
- **2026-07-06 하드닝 세션**: 플러그인 버전관리 버그·import 확인우회(HIGH)·설치중단 복구(MEDIUM)·전역 YES게이트·plugin-sync 잠재버그(다중 MCP 누락)·npm audit 실행불가 버그 — 전부 수정·커밋(`db9e09d`~`f105e85`, 총 10여 커밋). 저작권자 "SoDam AI Studio" 확정. GitHub 저장소 PUBLIC 전환 완료.
- **검증 방법**: `npm test`(e2e 28건) + `npm audit` + `claude plugin validate --strict` — 전부 통과 상태에서 세션 종료.

## 사람이 아직 안 한 것 (코드 문제 아님)

- [ ] 실제 Claude Code 라이브 세션 재시작 후 agent 호출·MCP 연결 최종 확인 (여러 세션 있었음, 재시작 후 재확인 안 됨)
- [ ] 저작권 개인 실명 전환 여부 (현재 "SoDam AI Studio" 유지 중, 사용자가 "나중에 결정"이라고 명시 — 바꾸려면 `LICENSE`·`NOTICE`·`README.md/.en.md` §13/§Copyright 4곳 동시 수정 필요)
- [ ] (구조적으로 항상 열림, 지금 못 고침) AI 생성 콘텐츠 저작권 리스크 — 법 자체가 유동적이라 상업화 본격화 시점에 재검토

## 현재 저장소 상태 (사실관계 — 다음 세션이 재확인 없이 바로 신뢰 가능)

- GitHub `sodam-ai/SoDam-Agent` = **PUBLIC** (2026-07-06 전환 완료)
- **기본 브랜치 = `feat/plugin-marketplace`**(main/master 아님). 로컬도 이 브랜치에서 작업 중이면 이게 이미 "기본 브랜치"라 PR/merge 불필요 — push만 하면 GitHub 메인 화면에 바로 반영됨
- MD 문서(`README.md/.en.md`, `GUIDE.md/.en.md`)와 HTML 문서(동일 파일명 `.html`)는 **프로젝트 최상위 폴더**에 있음 — `docs/` 폴더가 아님(이번 세션에 여러 번 오갔던 결정, 최종 확정: 최상위). `docs/*.pdf`·`docs/*.html`은 `.gitignore`에 등록되어 있고, PDF는 완전히 제거됨(재생성 금지 방침)
- 마지막 안전 점검(비밀정보 스캔·npm audit·e2e) 전부 통과 상태에서 세션 종료 — Phase 3 시작 전 재실행해서 베이스라인 깨끗한지 한 번 확인 권장(`npm test && npm audit`)

## 이번 세션에서 실제로 부딪힌 함정 (반복하면 시간 낭비 — 꼭 읽기)

1. **`rm`/`git rm`은 에이전트가 실행하면 무조건 차단됨** — 파일 1개만 지워도, `--cached`(실제 삭제 없이 추적만 해제)를 써도 동일하게 막힘. 우회 시도하지 말 것(안전장치임). 파일 삭제가 필요하면 **사용자에게 `!` 접두사로 직접 명령을 실행해달라고 요청**하거나, 사용자가 직접 탐색기/터미널에서 지우게 안내.
2. **`claude plugin update`는 버전 번호만 봄** — `plugins/*/agents/*.md`나 `commands/*.md` 내용을 바꿨는데 `plugin.json`의 `version`을 안 올리면, 이미 설치한 사용자는 `update`를 실행해도 절대 갱신 안 됨(콘텐츠 비교 안 하고 "이미 최신"이라 판단). **`plugins/<팀>/agents/*.md` 또는 `commands/*.md`를 고치면 반드시 그 팀의 `plugin.json` 버전 + `marketplace.json`의 대응 버전을 함께 올릴 것.**
3. **`src/presets.mjs`가 유일한 정본** — `plugins/<팀>/agents/*.md`·`.mcp.json`을 손으로 고치면 안 됨(e2e "프리셋 정본" 드리프트 테스트가 실패함). `presets.mjs` 수정 → `src/plugin-sync.mjs`의 `syncToDisk()` 호출로 재생성.
4. **권한줄(`disallowedTools`/`tools`) 로직은 `validate.mjs#agentPermissionLine()` 한 곳에만 존재해야 함** — `install.mjs`(CLI 경로)와 `plugin-sync.mjs`(마켓 경로)가 각자 구현했다가 한쪽만 고쳐서 조용히 어긋난 사고가 실제로 있었음(2026-07-04).
5. **이 PC에는 Claude Code 라이브 세션이 여러 개 동시에 떠 있을 수 있음**(한때 9개 확인됨) — 플러그인을 재설치/업데이트해도, 이미 켜져 있던 다른 세션은 재시작 전까지 구버전 캐시를 계속 씀.
6. **내부 이름 이중성은 의도적** — `AGENTROSTER_HOME`, `~/.agentroster/`, `*.agentroster.json` 같은 옛 이름 문자열은 사용자 노출면(`sodam-agent`)과 다르지만 **일부러 유지**하는 것(바꾸면 기존 사용자 백업 경로·export 파일이 깨짐). "정합화"랍시고 고치지 말 것.

## 다음 작업: Phase 3 (멀티 도구 확대 + 커뮤니티 디렉터리)

> PRD 원문(01_PRD §3, 03_PHASES Phase 3) 기준. 순서대로 진행 권장 — 뒤 마일스톤이 앞 마일스톤에 의존.

### M1: 프리셋 라이브러리 확대 + 카테고리/검색
- [ ] `src/presets.mjs`에 프리셋 추가(또는 기존 5종 세분화) + `category` 필드 기준 검색/필터 기능(`cmdList`에 카테고리별 표시 또는 `list --category <이름>`)
- 검증: `node test/e2e.mjs` 통과 + `node bin/cli.mjs list`로 카테고리 표시 육안 확인
- done-when: 새 프리셋이 CLI·플러그인 양쪽에 drift 없이 반영(`plugin-sync.mjs#syncToDisk()` 실행 후 e2e "프리셋 정본" 테스트 통과)
- 상태: pending

### M2: 멀티 도구 확대 — Gemini CLI · Cursor 등 (TargetEnv 추가 + 변환기)
- [ ] `src/writers/` 아래 신규 변환기 추가(예: `gemini.mjs`) — `writers/codex.mjs`를 참고 패턴으로 사용(정직한 한계 고지, 전역 설정 자동수정 금지 원칙 동일 적용)
- [ ] 대상 도구의 실제 설정 형식(에이전트/역할 지침 파일 위치, MCP 설정 형식)을 공식 문서로 먼저 조사 — 추측 금지
- 검증: 신규 변환기 전용 e2e 시나리오 추가 후 `node test/e2e.mjs` 통과
- done-when: 최소 1개 신규 도구로 실제 설치 파일 생성 + 그 도구에서 실제 인식 확인(헤드리스 또는 실사용)
- 상태: pending
- ⚠️ 주의(PRD 명시): "도구가 늘수록 형식 변환·검증 부담 커짐 — 추가할 때마다 실제 e2e 검증 필수." "실행기로 번지지 않도록 Out of Scope(01_PRD §6) 재확인" — 세션 관리·병렬실행 기능은 여전히 범위 밖.

### M3: 커뮤니티 공유 디렉터리 (선택 기능)
- [ ] 내보낸 팀(`*.agentroster.json`)을 모아보는 간단한 디렉터리 — PRD가 "선택"으로 명시, 서버/DB 없이 정적 방식(예: GitHub 저장소 내 카탈로그 파일) 우선 검토
- [ ] 이 기능이 "설치 도구 ≠ 실행기" 선을 넘지 않는지 재확인(계정/로그인 추가 금지 원칙과 충돌 여부 점검)
- 상태: pending (M1·M2 이후 착수 권장)

## 세션 시작 프롬프트 (다음 세션에 그대로 붙여넣기)

```
D:\AI_Dev_Work\2026y\26y_06m_21d_SoDam-Agent 에서 작업 이어갈게.
CHECKPOINT.md 읽고 Phase 3 M1부터 시작해줘.
```
