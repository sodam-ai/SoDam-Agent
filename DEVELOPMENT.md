# 개발 가이드 (DEVELOPMENT)

> 사용자용 안내는 [`README.md`](./README.md)에 있습니다. 이 문서는 개발·테스트용입니다.

## 요구 사항
- Node.js ≥ 18 (외부 의존성 0 — `npm install` 불필요)

## 실행
```bash
node bin/cli.mjs            # 대화형 메뉴
node bin/cli.mjs list       # 프리셋 목록
node bin/cli.mjs doctor     # 환경 진단
node bin/cli.mjs install web-app-team --dir <폴더> --yes
node bin/cli.mjs rollback   --dir <폴더> --yes
```

## 테스트
```bash
node test/e2e.mjs           # 자동 e2e 검증(설치·형식·병합·멱등성·손상중단·되돌리기)
```

## 구조
```
SoDam-Agent/
├── bin/
│   ├── cli.mjs            # 진입점
│   └── 시작하기.bat        # Windows 더블클릭 진입(ASCII·CRLF)
├── src/
│   ├── main.mjs          # 인자 분기 + 대화형 메뉴
│   ├── ui.mjs            # 출력·입력(번호 메뉴) — 후속: @clack/prompts 화살표 메뉴
│   ├── validate.mjs      # 이름 화이트리스트·프리셋 스키마 검증(보안)
│   ├── paths.mjs         # 설치 대상 경로(프로젝트 스코프)
│   ├── presets.mjs       # 프리셋 10종(web-app/docs/research/data/marketing/security-audit/devops/customer-support/pm/localization)
│   ├── install.mjs       # 미리보기(plan) → 적용(apply), MCP 병합
│   ├── backup.mjs        # 백업·되돌리기(추가 파일 정확 삭제)
│   └── doctor.mjs        # 환경 진단
├── test/e2e.mjs
└── .PRD/                 # 설계 문서(01_PRD ~ 08_M3_COMMUNITY_DIRECTORY, README·RESEARCH_SOURCES 포함, 10개)
```

## 설계 원칙 (PRD 발췌)
- 에이전트는 **파일 기반**(`.claude/agents/` + `.mcp.json`)으로 설치 — 플러그인 배포는 per-agent MCP 무시됨.
- 모든 쓰기 전 **자동 백업**, 설치될 명령은 **미리보기 확인**(명령 주입 방지).
- 이름은 **소문자·하이픈 화이트리스트**만(경로 조작 방지). 비밀은 **환경변수 키명만** 기록.
- 관리자 권한 불요. 기본 **프로젝트 스코프**.

## 아직 안 된 것 (다음 후보)
- @clack/prompts 화살표 메뉴(현재는 번호 입력식)
- 에이전트 실제 호출 시 MCP 연결(context7)의 라이브 세션 재검증 — 2026-07-06에 캐시는 최신화했으나, 이 캐시를 실제로 로드하는 세션 재시작 후 확인은 아직 사람이 직접 안 함(아래 참조)

## 실 마켓플레이스 설치 e2e — 검증 완료 (2026-07-06)
- 이 PC의 실제 전역 설치(scope: user)가 `claude plugin install`/`uninstall`로 이미 몇 주째 라이브 사용 중이었음이 확인됨(`claude plugin list --json`).
- 단, 설치된 캐시가 레포의 최신 수정(2026-07-03~04 disallowedTools 통일)을 반영 못 한 **stale 상태**였음 — `plugin.json` 버전이 안 올라가 있어 `claude plugin update`가 "이미 최신"이라며 갱신을 건너뛰는 버그를 발견.
- 조치: web-app-team·research-team·sodam-agent를 `claude plugin uninstall` → `claude plugin install`로 강제 재설치해 캐시를 레포와 바이트 단위로 일치시킴. 동시에 `plugin.json`·`marketplace.json` 버전을 올림(web-app-team/research-team 0.1.0→0.1.1, sodam-agent 0.1.1→0.1.2)해 앞으로 `claude plugin update`가 실제로 작동하게 함.
- **규칙(향후 필수)**: `plugins/*/agents/*.md` 또는 `plugins/*/commands/*.md` 내용을 바꿀 때마다 해당 `plugin.json`의 `version`과 `marketplace.json`의 대응 버전을 반드시 함께 올릴 것. 안 올리면 이미 설치한 사용자는 `update`로 절대 갱신되지 않는다(uninstall/reinstall만 먹힘 — 사용자 경험상 치명적).
- **남은 검증**: 캐시 자체는 최신화했으나, 이미 켜져 있던 라이브 세션(9개 프로세스)은 재시작 전까지 구버전을 계속 참조한다. 실제 agent 호출로 context7 MCP가 연결되는지는 새 세션에서 사람이 확인 필요.

## 보안 감사 — install.mjs/share.mjs/paths.mjs/backup.mjs/writers/codex.mjs (2026-07-06)
- **[HIGH, 수정 완료]** `sodam-agent import <파일> --yes`가 확인(confirm) 게이트를 건너뛰던 문제 수정. 외부에서 가져온 팀 파일은 01_PRD §8 Must-Have("사용자 미확인 상태로 실행형 명령이 설정에 안 써짐")에 따라 `--yes`로도 항상 확인받도록 `src/main.mjs#cmdImport` 변경(`test/e2e.mjs`는 CLI가 아닌 `readImport()`를 직접 호출해 영향 없음, 28건 전체 재통과 확인).
- **[MEDIUM, 수정 완료]** `install.mjs#applyPlan`이 `install-record.json`을 파일 쓰기 **전**에 먼저 기록하도록 순서 변경 — 설치 중간에 프로세스가 죽어도 되돌리기가 '무엇을 추가/덮어쓰려 했는지' 항상 알 수 있음(28건 재통과 확인).
- **[LOW, 미수정]** 전역(`--global`) 설치·되돌리기가 프로젝트와 동일한 confirm() 사용 — PRD Should-Have의 "더 강한 YES 확인"까지는 아님(백업+경고+confirm 자체는 있어 실질 위험 낮음).
- 나머지(경로조작·비밀키 제거·import 스키마 화이트리스트·원자적 파일쓰기)는 직접 코드 대조 결과 견고함을 확인.

## 구현 완료 (Phase 2)
- 전역(`~/.claude`) 설치 — e2e §18~20 검증됨
- 팀 내보내기/가져오기(ExportFile) — `src/share.mjs` 완성, e2e §10~12 검증됨
- Codex 역할 번역 — `src/writers/codex.mjs` 완성, e2e §22~27 검증됨
