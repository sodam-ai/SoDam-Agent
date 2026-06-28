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
agentroster/
├── bin/
│   ├── cli.mjs            # 진입점
│   └── 시작하기.bat        # Windows 더블클릭 진입(ASCII·CRLF)
├── src/
│   ├── main.mjs          # 인자 분기 + 대화형 메뉴
│   ├── ui.mjs            # 출력·입력(번호 메뉴) — 후속: @clack/prompts 화살표 메뉴
│   ├── validate.mjs      # 이름 화이트리스트·프리셋 스키마 검증(보안)
│   ├── paths.mjs         # 설치 대상 경로(프로젝트 스코프)
│   ├── presets.mjs       # 프리셋 5종(web-app/docs/research/data/marketing)
│   ├── install.mjs       # 미리보기(plan) → 적용(apply), MCP 병합
│   ├── backup.mjs        # 백업·되돌리기(추가 파일 정확 삭제)
│   └── doctor.mjs        # 환경 진단
├── test/e2e.mjs
└── .PRD/                 # 설계 문서(01_PRD ~ 04_PROJECT_SPEC)
```

## 설계 원칙 (PRD 발췌)
- 에이전트는 **파일 기반**(`.claude/agents/` + `.mcp.json`)으로 설치 — 플러그인 배포는 per-agent MCP 무시됨.
- 모든 쓰기 전 **자동 백업**, 설치될 명령은 **미리보기 확인**(명령 주입 방지).
- 이름은 **소문자·하이픈 화이트리스트**만(경로 조작 방지). 비밀은 **환경변수 키명만** 기록.
- 관리자 권한 불요. 기본 **프로젝트 스코프**.

## 아직 안 된 것 (다음 후보)
- @clack/prompts 화살표 메뉴(현재는 번호 입력식)
- 실 Claude Code에서의 마켓플레이스 설치 e2e(형식-동등성으로는 입증됨, 인간 직접 검증 필요)

## 구현 완료 (Phase 2)
- 전역(`~/.claude`) 설치 — e2e §18~20 검증됨
- 팀 내보내기/가져오기(ExportFile) — `src/share.mjs` 완성, e2e §10~12 검증됨
- Codex 역할 번역 — `src/writers/codex.mjs` 완성, e2e §22~27 검증됨
