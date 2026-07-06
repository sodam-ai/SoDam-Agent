# SoDam-Agent — 마일스톤 체크포인트

> 다음 세션은 이 파일부터 읽으면 됩니다. 상세 배경은 `.PRD/03_PHASES.md`(로컬 전용, git 추적 안 됨)를 참고하세요.

## 지금까지 완료된 것 (Phase 1 + Phase 2)

- **Phase 1(MVP)**: 프리셋 5종(웹앱·문서·리서치·마케팅·데이터) + 관리도구(`sodam-agent`) 6개 플러그인, 백업/되돌리기, doctor 진단, 대화형 메뉴, 보안 기본기(경로차단·명령미리보기·비밀금지) — 전부 구현·e2e 28건 검증.
- **Phase 2**: Codex 역할 번역(베타), 팀 export/import(공유) — 구현·검증 완료.
- **2026-07-06 하드닝 세션**: 플러그인 버전관리 버그·import 확인우회(HIGH)·설치중단 복구(MEDIUM)·전역 YES게이트·plugin-sync 잠재버그(다중 MCP 누락)·npm audit 실행불가 버그 — 전부 수정·커밋(`db9e09d`~`f105e85`, 총 10여 커밋). 저작권자 "SoDam AI Studio" 확정. GitHub 저장소 PUBLIC 전환 완료.
- **검증 방법**: `npm test`(e2e 28건) + `npm audit` + `claude plugin validate --strict` — 전부 통과 상태에서 세션 종료.

## 사람이 아직 안 한 것 (코드 문제 아님)

- [ ] 실제 Claude Code 라이브 세션 재시작 후 agent 호출·MCP 연결 최종 확인 (여러 세션 있었음, 재시작 후 재확인 안 됨)
- [ ] 저작권 개인 실명 전환 여부 (현재 "SoDam AI Studio" 유지 중, 사용자가 "나중에 결정"이라고 명시)

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
