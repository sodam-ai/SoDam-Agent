// 자동 e2e 검증 — "빌드 통과 ≠ 작동". 실제 파일 쓰기·병합·멱등성·되돌리기를 임시 폴더에서 확인.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { resolveTarget } from '../src/paths.mjs';
import { PRESETS, getPreset, getRoleLibrary } from '../src/presets.mjs';
import { buildPlan, applyPlan, verifyInfo } from '../src/install.mjs';
import { listBackups, restoreBackup } from '../src/backup.mjs';
import { isSafeName, toSafeName } from '../src/validate.mjs';
import { buildExport, writeExport, readImport } from '../src/share.mjs';
import { rolesDir, listPersonalRoles, saveRole, removeRole } from '../src/roles.mjs';
import { expectedPluginFiles } from '../src/plugin-sync.mjs';
import { agentsMd, skillMd, codexConfigToml, buildCodexPlan, applyCodexPlan } from '../src/writers/codex.mjs';
import { geminiAgentMd, geminiMcpSnippet, buildGeminiPlan, applyGeminiPlan } from '../src/writers/gemini.mjs';
import { cursorAgentsMd, buildCursorPlan, applyCursorPlan } from '../src/writers/cursor.mjs';
import { presetsInCategory, groupPresetsByCategory } from '../src/main.mjs';

let pass = 0;
const ok = (m) => {
  console.log('  ✅ ' + m);
  pass++;
};

function freshTmp() {
  const d = path.join(os.tmpdir(), 'agentroster-e2e');
  fs.rmSync(d, { recursive: true, force: true });
  fs.mkdirSync(d, { recursive: true });
  return d;
}

const root = freshTmp();
console.log('E2E 임시 폴더:', root, '\n');
const target = resolveTarget(root);

// 0) 보안: 이름 화이트리스트
assert.equal(isSafeName('reviewer'), true);
assert.equal(isSafeName('../evil'), false);
assert.equal(isSafeName('Bad Name'), false);
assert.equal(isSafeName('a/b'), false);
ok('보안: 위험한 이름(../, 공백, 슬래시) 차단');

// 1) 설치
const { backup: firstBackup } = applyPlan(buildPlan(getPreset('web-app-team'), target));
for (const name of ['planner', 'frontend-dev', 'backend-dev', 'reviewer']) {
  assert.ok(fs.existsSync(path.join(target.agentDir, `${name}.md`)), `${name}.md 생성됨`);
}
ok('설치: 웹앱팀 에이전트 4개 파일 생성');

const reviewerMd = fs.readFileSync(path.join(target.agentDir, 'reviewer.md'), 'utf8');
assert.ok(reviewerMd.startsWith('---\nname: reviewer\n'), 'frontmatter 시작');
assert.ok(reviewerMd.includes('\nmodel: inherit\n'), 'model 필드');
assert.ok(reviewerMd.includes('tools: Read, Grep, Glob'), 'tools 최소권한');
ok('설치: 에이전트 frontmatter 형식 정확(name/description/tools/model)');

const mcp1 = JSON.parse(fs.readFileSync(target.mcpPath, 'utf8'));
assert.ok(mcp1.mcpServers.context7, '.mcp.json에 context7 자동 기록');
assert.equal(mcp1.mcpServers.context7.command, 'npx');
ok('설치: .mcp.json에 MCP 자동 연결 기록');

assert.ok(fs.existsSync(path.join(target.backupRoot, firstBackup.id, 'manifest.json')), '백업 manifest');
ok('안전: 설치 전 자동 백업 생성');

assert.ok(fs.readFileSync(path.join(root, '.gitignore'), 'utf8').includes('.agentroster/'), 'gitignore');
ok('보안: .gitignore에 백업 폴더(비밀 포함 가능) 자동 제외');

// 2) 멱등성: 다시 설치해도 MCP 중복/깨짐 없음
applyPlan(buildPlan(getPreset('web-app-team'), target));
const mcp2 = JSON.parse(fs.readFileSync(target.mcpPath, 'utf8'));
assert.equal(Object.keys(mcp2.mcpServers).length, 1, 'MCP 1개 유지');
ok('멱등성: 재설치해도 MCP 중복 안 생김');

// 3) 기존 사용자 MCP 보존(병합)
fs.writeFileSync(
  target.mcpPath,
  JSON.stringify({ mcpServers: { myown: { command: 'node', args: ['x.js'] } } }, null, 2)
);
applyPlan(buildPlan(getPreset('docs-team'), target)); // docs-team은 MCP 없음 → 보존만 확인
const mcp3 = JSON.parse(fs.readFileSync(target.mcpPath, 'utf8'));
assert.ok(mcp3.mcpServers.myown, '기존 사용자 MCP 보존됨');
ok('병합: 사용자가 직접 넣은 기존 .mcp.json 설정 보존');

// 4) 손상된 .mcp.json은 덮어쓰지 않고 안전 중단
fs.writeFileSync(target.mcpPath, '{ 이건 깨진 JSON ');
let blocked = false;
try {
  buildPlan(getPreset('web-app-team'), target);
} catch {
  blocked = true;
}
assert.ok(blocked, '손상 파일에서 설치 중단');
ok('안전: 손상된 .mcp.json은 덮어쓰지 않고 설치 중단');

// 5) 되돌리기: 첫 설치 시점으로 복구 → 추가됐던 에이전트 제거
fs.writeFileSync(target.mcpPath, JSON.stringify({ mcpServers: {} }, null, 2)); // 손상본 정리
const all = listBackups(target);
const first = all[all.length - 1]; // 가장 오래된 = 최초 설치 직전(빈 상태)
restoreBackup(target, first.id);
assert.ok(!fs.existsSync(path.join(target.agentDir, 'planner.md')), 'planner.md 제거됨');
assert.ok(!fs.existsSync(path.join(target.agentDir, 'reviewer.md')), 'reviewer.md 제거됨');
ok('되돌리기: 최초 설치가 추가한 에이전트 모두 제거(원상복구)');

// 6) 공유: 내보내기 → 가져오기 왕복
const expFile = path.join(root, 'team.agentroster.json');
writeExport(buildExport(getPreset('web-app-team')), expFile);
assert.ok(fs.existsSync(expFile), '내보내기 파일 생성');
const imported = readImport(expFile);
assert.equal(imported.id, 'web-app-team', '가져오기 id 복원');
assert.equal(imported.roles.length, 4, '가져오기 역할 4개 복원');
ok('공유: 내보내기 → 가져오기 왕복 정상');

// 7) 보안: 공유 파일에 비밀 '값'이 안 들어감(키 이름만)
const withSecret = {
  id: 'sec-team', name: 'sec', description: 'x',
  roles: [{ name: 'r1', description: 'd', systemPrompt: 's' }],
  tools: [{ id: 'mcpx', type: 'mcp', name: 'X', installSpec: { command: 'npx', args: [], env: { API_KEY: 'super-secret-value' } } }],
};
const exp2 = buildExport(withSecret);
assert.equal(exp2.tools[0].installSpec.env.API_KEY, '', '비밀 값 제거(키 이름만)');
assert.ok(!JSON.stringify(exp2).includes('super-secret-value'), '공유 객체에 비밀 값 없음');
ok('보안: 공유 파일에 비밀 값 미포함(키 이름만 보존)');

// 8) 보안: 악성 가져오기 차단(경로조작 이름·형식불일치·대용량)
function importBlocked(name, content) {
  const f = path.join(root, name);
  fs.writeFileSync(f, content);
  try { readImport(f); return false; } catch { return true; }
}
assert.ok(importBlocked('evil.json', JSON.stringify({ format: 'agentroster-team', version: 1, id: '../../evil', roles: [{ name: 'x', description: 'd', systemPrompt: 's' }] })), '경로조작 id 차단');
assert.ok(importBlocked('bad.json', JSON.stringify({ hello: 'world' })), '형식 불일치 차단');
assert.ok(importBlocked('big.json', '{"format":"agentroster-team","version":1,"roles":[],"_pad":"' + 'A'.repeat(300 * 1024) + '"}'), '대용량(256KB+) 차단');
ok('보안: 악성 가져오기 차단(경로조작·형식불일치·대용량)');

// 9) 커스텀 팀: 이름 정화 + 라이브러리에서 역할 골라 조립 → 설치
assert.equal(toSafeName('My Blog Team'), 'my-blog-team', '이름 정화(영문)');
assert.equal(toSafeName('  weird__name!! '), 'weird-name', '이름 정화(특수문자)');
assert.equal(toSafeName('내 팀'), '', '한글 이름→빈값(호출부 기본값으로 대체)');
const lib = getRoleLibrary();
assert.ok(lib.length >= 8, '역할 라이브러리 통합(중복 제거)');
const cTarget = resolveTarget(path.join(root, 'custom-proj'));
const customTeam = {
  id: 'my-blog-team', name: '내 블로그팀', description: '커스텀',
  roles: lib.filter((r) => ['planner', 'writer'].includes(r.name)), // 서로 다른 프리셋의 역할 조합
  tools: [],
};
applyPlan(buildPlan(customTeam, cTarget));
assert.ok(fs.existsSync(path.join(cTarget.agentDir, 'planner.md')), 'planner.md 설치');
assert.ok(fs.existsSync(path.join(cTarget.agentDir, 'writer.md')), 'writer.md 설치');
ok('커스텀: 역할 라이브러리에서 골라 조립 → 설치');

// 10) 설치 확인(verify, 읽기 전용): 깔린 에이전트를 정확히 읽어오는가
const vTarget = resolveTarget(path.join(root, 'verify-proj'));
assert.equal(verifyInfo(vTarget).agents.length, 0, '설치 전: 0개');
applyPlan(buildPlan(getPreset('web-app-team'), vTarget));
const vinfo = verifyInfo(vTarget);
const names = vinfo.agents.map((a) => a.name).sort();
assert.deepEqual(names, ['backend-dev', 'frontend-dev', 'planner', 'reviewer'], 'verify가 이름 정확히 읽음');
assert.equal(vinfo.hasMcp, true, 'verify가 .mcp.json 감지');
ok('확인(verify): 설치된 에이전트 이름·MCP 정확히 읽음(읽기 전용)');

// 11) 내 역할 관리: 추가 → 목록 → (이름 보안) → 삭제  (홈은 임시폴더로 격리)
process.env.AGENTROSTER_HOME = path.join(root, 'home');
assert.equal(listPersonalRoles().length, 0, '처음엔 내 역할 0');
saveRole({ name: 'seo-expert', description: '검색 최적화를 점검할 때', systemPrompt: '당신은 SEO 전문가입니다. 검색 노출을 점검하세요.', allowedTools: ['Read', 'Grep'], model: 'inherit' });
const mine = listPersonalRoles();
assert.equal(mine.length, 1, '추가 후 1개');
assert.equal(mine[0].name, 'seo-expert', '이름 복원');
assert.equal(mine[0].description, '검색 최적화를 점검할 때', '설명 복원');
assert.deepEqual(mine[0].allowedTools, ['Read', 'Grep'], '권한 복원');
ok('내 역할: 추가 → 목록 정확 복원(설명·권한 포함)');

let roleNameBlocked = false;
try { saveRole({ name: '../evil', description: 'd', systemPrompt: 's' }); } catch { roleNameBlocked = true; }
assert.ok(roleNameBlocked, '위험한 역할 이름(../) 차단');
let emptyBlocked = false;
try { saveRole({ name: 'x-role', description: '', systemPrompt: '' }); } catch { emptyBlocked = true; }
assert.ok(emptyBlocked, '빈 설명/지시문 저장 거부');
ok('보안: 위험한 이름·빈 입력 저장 차단');

removeRole('seo-expert');
assert.equal(listPersonalRoles().length, 0, '삭제 후 0');
ok('내 역할: 삭제 정상');

// 12) 전역 설치(--global): 모든 폴더 공용 ~/.claude/agents에 설치 + 충돌 백업/되돌리기 (홈=임시폴더로 격리)
process.env.AGENTROSTER_HOME = path.join(root, 'home');
const g = resolveTarget(null, { global: true });
assert.equal(g.scope, 'global', 'scope=global');
assert.equal(g.mcpPath, null, '전역은 프로젝트 .mcp.json을 쓰지 않음(사용자 MCP 보호)');
assert.ok(g.agentDir.startsWith(path.join(root, 'home')), '전역 경로가 격리된 홈 안');
ok('전역: 경로/스코프 정확(mcpPath 없음 → 사용자 MCP 자동수정 안 함)');

// 기존 전역 에이전트가 있다고 가정(이름 충돌 재현: planner)
fs.mkdirSync(g.agentDir, { recursive: true });
fs.writeFileSync(path.join(g.agentDir, 'planner.md'), '---\nname: planner\n---\nOLD-GLOBAL-PLANNER');
const gplan = buildPlan(getPreset('web-app-team'), g);
assert.ok(gplan.agents.find((a) => a.name === 'planner').exists, '충돌(planner) 감지');
assert.equal(Object.keys(gplan.newServers).length, 0, '전역은 자동 MCP 0');
assert.equal(gplan.manualMcp.length, 1, '전역 MCP는 수동 안내로만 표시(context7)');
const { backup: gbk } = applyPlan(gplan);
for (const n of ['planner', 'frontend-dev', 'backend-dev', 'reviewer']) {
  assert.ok(fs.existsSync(path.join(g.agentDir, `${n}.md`)), `전역 ${n}.md 설치`);
}
// 핵심 안전: 백업은 '덮어쓴' 파일만 — 폴더의 다른 전역 에이전트를 통째 복사하지 않음
const gman = JSON.parse(fs.readFileSync(path.join(gbk.dest, 'manifest.json'), 'utf8'));
assert.deepEqual(gman.files.sort(), ['agents/planner.md'], '백업은 덮어쓴 파일만(통째 복사 X)');
assert.ok(!fs.existsSync(path.join(root, 'home', '.gitignore')), '전역은 홈에 .gitignore 안 만듦');
ok('전역 설치: ~/.claude/agents에 설치 + 충돌 파일만 백업(+홈 gitignore 없음)');

// 되돌리기: 전역도 원상복구 — 추가분 삭제 + 덮어쓴 원본 복원
restoreBackup(g, gman.id);
assert.ok(
  fs.readFileSync(path.join(g.agentDir, 'planner.md'), 'utf8').includes('OLD-GLOBAL-PLANNER'),
  '덮어쓴 planner 원본 복원'
);
assert.ok(!fs.existsSync(path.join(g.agentDir, 'reviewer.md')), '설치가 추가한 reviewer 제거');
ok('전역 되돌리기: 추가분 삭제 + 덮어쓴 원본 복원(원상복구)');

// 13) 프리셋 단일 정본: plugins/*의 에이전트·MCP가 presets.mjs에서 생성한 것과 어긋나지 않는지(drift 차단)
for (const e of expectedPluginFiles()) {
  const rel = e.file.split(/[\\/]plugins[\\/]/)[1].replace(/\\/g, '/');
  if (e.kind === 'agent') {
    assert.equal(fs.readFileSync(e.file, 'utf8'), e.content, `정본 동기화: plugins/${rel}`);
  } else {
    assert.deepEqual(JSON.parse(fs.readFileSync(e.file, 'utf8')), e.servers, `정본 동기화(mcp): plugins/${rel}`);
  }
}
ok('프리셋 정본: plugins 에이전트/MCP가 presets.mjs와 일치(presets만 고치면 됨·drift 차단)');

// 14) Codex 역할 번역 (Phase 2-a) — 같은 팀 정의를 Codex 형식(AGENTS.md + skills + config.toml)으로
const wap = getPreset('web-app-team');

const am = agentsMd(wap);
assert.ok(am.includes('planner') && am.includes('reviewer'), 'AGENTS.md에 역할 포함');
assert.ok(/번역|같은 팀이 아닙|멀티 ?에이전트|병렬/.test(am), 'Codex 한계 정직 고지 포함');
ok('Codex: AGENTS.md에 역할(모드) + 정직한 한계 고지');

const sk = skillMd(wap.roles[0]); // planner
assert.ok(sk.startsWith('---\nname: planner\n'), 'SKILL frontmatter name');
assert.ok(sk.includes('description:'), 'SKILL description');
assert.ok(sk.includes(wap.roles[0].systemPrompt.slice(0, 12)), 'SKILL 본문에 지시문');
ok('Codex: SKILL.md 형식(frontmatter + 지시문)');

const toml = codexConfigToml(wap);
assert.ok(toml.includes('[mcp_servers.context7]'), 'TOML mcp_servers 섹션');
assert.ok(toml.includes('command = "npx"'), 'TOML command');
assert.ok(toml.includes('args = ["-y", "@upstash/context7-mcp"]'), 'TOML args');
assert.equal(codexConfigToml(getPreset('docs-team')).trim(), '', 'MCP 없는 팀은 빈 TOML');
ok('Codex: config.toml MCP 스니펫(TOML) + MCP 없으면 빈 값');

const cxRoot = path.join(root, 'codex-proj');
const cxPlan = buildCodexPlan(wap, cxRoot);
assert.ok(cxPlan.agentsFile.endsWith('AGENTS.md'), 'AGENTS.md 경로');
assert.equal(cxPlan.skills.length, 4, '역할 4개 스킬');
assert.ok(cxPlan.skills.every((s) => s.file.includes(path.join('.agents', 'skills'))), '스킬 경로 .agents/skills');
ok('Codex: buildCodexPlan 파일 목록 정확(AGENTS.md + 스킬4)');

fs.mkdirSync(cxRoot, { recursive: true });
fs.writeFileSync(path.join(cxRoot, 'AGENTS.md'), 'OLD-AGENTS-CONTENT');
applyCodexPlan(buildCodexPlan(wap, cxRoot));
assert.ok(fs.existsSync(path.join(cxRoot, 'AGENTS.md')), 'AGENTS.md 생성');
assert.ok(
  fs.readFileSync(path.join(cxRoot, 'AGENTS.md.bak'), 'utf8').includes('OLD-AGENTS-CONTENT'),
  '기존 AGENTS.md 백업(.bak)'
);
assert.ok(fs.existsSync(path.join(cxRoot, '.agents', 'skills', 'planner', 'SKILL.md')), 'planner SKILL 생성');
ok('Codex: 적용 — AGENTS.md+스킬 생성 + 기존 AGENTS.md 백업');

let cxBlocked = false;
try {
  skillMd({ name: '../evil', description: 'd', systemPrompt: 's' });
} catch {
  cxBlocked = true;
}
assert.ok(cxBlocked, 'Codex 스킬 역할 이름 경로조작 차단');
ok('Codex 보안: 역할 이름 경로조작 차단');

// 15) Phase 3 M1: 카테고리 필터/그룹핑 — 신규 프리셋 없이 기존 category 필드로 검색·표시
assert.equal(presetsInCategory('개발').length, 1, '개발 카테고리 1건');
assert.equal(presetsInCategory('개발')[0].id, 'web-app-team', '개발 카테고리=웹앱팀');
assert.equal(presetsInCategory('없는카테고리').length, 0, '없는 카테고리는 빈 배열');
ok('M1: 카테고리 필터(presetsInCategory)가 실제 프리셋을 정확히 좁힘');

const synthetic = [
  { id: 'a', category: 'X' },
  { id: 'b', category: 'Y' },
  { id: 'c', category: 'X' },
];
const grouped = groupPresetsByCategory(synthetic);
assert.deepEqual([...grouped.keys()], ['X', 'Y'], '카테고리 등장 순서 유지');
assert.deepEqual(grouped.get('X').map((p) => p.id), ['a', 'c'], '같은 카테고리는 순서대로 묶임(비연속이어도 정확)');
ok('M1: 카테고리 그룹핑(groupPresetsByCategory)이 등장 순서를 보존하며 정확히 묶음');

// 17) Gemini CLI 역할 변환 (Phase 3 M2) — 같은 팀 정의를 Gemini CLI 서브에이전트 형식(.gemini/agents/<role>.md)으로
const gm = geminiAgentMd(wap.roles[0]); // planner (allowedTools만 있음, disallowedTools 없음)
assert.ok(gm.startsWith('---\nname: planner\n'), 'Gemini frontmatter name');
assert.ok(gm.includes('description:'), 'Gemini frontmatter description');
assert.ok(gm.includes('model: inherit'), 'Gemini frontmatter model');
assert.ok(!gm.includes('tools:'), 'Gemini 스키마엔 신뢰할 매핑표 없이 tools 필드를 안 만듦(정직한 한계)');
assert.ok(gm.includes(wap.roles[0].systemPrompt.slice(0, 12)), 'Gemini 본문에 지시문');
ok('Gemini: frontmatter 형식(name/description/model, tools 생략) + 지시문');

const frontendDev = wap.roles.find((r) => r.name === 'frontend-dev'); // disallowedTools: [] (빈 배열=한계 문구 없음)
assert.ok(!geminiAgentMd(frontendDev).includes('금지목록을 지원하지 않아'), 'disallowedTools 빈 배열이면 한계 문구 없음');
const researcher = { name: 'researcher-x', description: 'd', systemPrompt: 's', disallowedTools: ['Edit', 'Write', 'Bash'] };
assert.ok(geminiAgentMd(researcher).includes('Edit, Write, Bash'), 'disallowedTools 있으면 정직한 한계 문구에 그대로 나열');
ok('Gemini: disallowedTools 역할은 "정직한 한계" 문구로 명시(전체 상속임을 숨기지 않음)');

const gsnippet = geminiMcpSnippet(wap);
assert.ok(gsnippet.includes('mcpServers:') && gsnippet.includes('context7:'), 'Gemini MCP 스니펫에 mcpServers 포함');
assert.equal(geminiMcpSnippet(getPreset('docs-team')), '', 'MCP 없는 팀은 빈 스니펫');
ok('Gemini: MCP 스니펫(YAML) 생성 + MCP 없으면 빈 값(자동 삽입은 안 함)');

const gxRoot = path.join(root, 'gemini-proj');
const gxPlan = buildGeminiPlan(wap, gxRoot);
assert.equal(gxPlan.roles.length, 4, '역할 4개 파일 계획');
assert.ok(gxPlan.roles.every((r) => r.file.includes(path.join('.gemini', 'agents'))), '경로 .gemini/agents');
const gxApplied = applyGeminiPlan(gxPlan);
for (const n of ['planner', 'frontend-dev', 'backend-dev', 'reviewer']) {
  assert.ok(fs.existsSync(path.join(gxRoot, '.gemini', 'agents', `${n}.md`)), `Gemini ${n}.md 생성`);
}
assert.equal(gxApplied.backups.length, 0, '첫 설치는 백업 없음(기존 파일 없음)');
fs.writeFileSync(path.join(gxRoot, '.gemini', 'agents', 'planner.md'), 'OLD-GEMINI-PLANNER');
const gxApplied2 = applyGeminiPlan(buildGeminiPlan(wap, gxRoot));
// 재설치 시점엔 첫 설치가 만든 4개 파일이 전부 "기존 파일"이라 4개 다 백업됨(빠짐없는 안전 백업 — 의도된 동작).
assert.equal(gxApplied2.backups.length, 4, '재설치 시 이미 존재하던 역할 파일 4개 전부 백업');
assert.ok(
  fs.readFileSync(path.join(gxRoot, '.gemini', 'agents', 'planner.md.bak'), 'utf8').includes('OLD-GEMINI-PLANNER'),
  '손대지 않은 파일도 백업되지만, 직접 고친 planner.md의 백업엔 그 내용이 그대로 담김'
);
ok('Gemini: 적용 — 역할 파일 4개 생성 + 재설치 시 기존 파일 전부 .bak 백업(빠짐없는 안전 백업)');

let gxBlocked = false;
try {
  geminiAgentMd({ name: '../evil', description: 'd', systemPrompt: 's' });
} catch {
  gxBlocked = true;
}
assert.ok(gxBlocked, 'Gemini 역할 이름 경로조작 차단');
ok('Gemini 보안: 역할 이름 경로조작 차단');

// 19) Cursor 역할 변환 (Phase 3 M2) — AGENTS.md(역할=모드, Codex 패턴 재사용) + .cursor/mcp.json 자동 병합
const cm = cursorAgentsMd(wap);
assert.ok(cm.includes('planner') && cm.includes('reviewer'), 'AGENTS.md에 역할 포함');
assert.ok(/호출.*가능한 역할|서브에이전트/.test(cm), 'Cursor 한계(호출형 서브에이전트 아님) 정직 고지 포함');
assert.ok(cm.includes('.cursor/mcp.json'), 'MCP 자동 연결 안내 포함');
ok('Cursor: AGENTS.md에 역할(모드) + 정직한 한계 고지 + MCP 자동연결 안내');

const crRoot = path.join(root, 'cursor-proj');
const crPlan1 = buildCursorPlan(wap, crRoot);
assert.equal(crPlan1.agentsExists, false, '첫 설치 전엔 AGENTS.md 없음');
assert.equal(Object.keys(crPlan1.newServers).length, 1, 'context7 신규 연결 대상 1개');
const crApplied1 = applyCursorPlan(crPlan1);
assert.ok(fs.existsSync(path.join(crRoot, 'AGENTS.md')), 'AGENTS.md 생성');
assert.equal(crApplied1.backup, null, '첫 설치는 백업 없음');
const crMcp1 = JSON.parse(fs.readFileSync(path.join(crRoot, '.cursor', 'mcp.json'), 'utf8'));
assert.equal(crMcp1.mcpServers.context7.command, 'npx', '.cursor/mcp.json에 context7 자동 기록');
ok('Cursor: 첫 설치 — AGENTS.md 생성 + .cursor/mcp.json 자동 생성·연결');

// 재설치: 기존 AGENTS.md 백업 + 기존 사용자 MCP 서버(myown)는 보존 + context7 중복 안 생김(멱등성)
fs.writeFileSync(
  path.join(crRoot, '.cursor', 'mcp.json'),
  JSON.stringify({ mcpServers: { myown: { command: 'node', args: ['x.js'] } } }, null, 2)
);
const crApplied2 = applyCursorPlan(buildCursorPlan(wap, crRoot));
assert.ok(crApplied2.backup && crApplied2.backup.endsWith('AGENTS.md.bak'), '재설치 시 기존 AGENTS.md 백업');
const crMcp2 = JSON.parse(fs.readFileSync(path.join(crRoot, '.cursor', 'mcp.json'), 'utf8'));
assert.ok(crMcp2.mcpServers.myown, '기존 사용자 MCP(myown) 보존됨');
assert.ok(crMcp2.mcpServers.context7, 'context7도 함께 연결됨');
assert.equal(Object.keys(crMcp2.mcpServers).length, 2, 'MCP 2개(중복 없이 병합)');
ok('Cursor: 재설치 — AGENTS.md .bak 백업 + 기존 사용자 MCP 보존 + 새 MCP만 추가(안전 병합)');

// 손상된 .cursor/mcp.json은 안전 중단(install.mjs와 동일 원칙)
fs.writeFileSync(path.join(crRoot, '.cursor', 'mcp.json'), '{ 이건 깨진 JSON ');
let crBlocked = false;
try {
  buildCursorPlan(wap, crRoot);
} catch {
  crBlocked = true;
}
assert.ok(crBlocked, '손상된 .cursor/mcp.json에서 설치 중단');
ok('Cursor 안전: 손상된 .cursor/mcp.json은 덮어쓰지 않고 설치 중단');

let crNameBlocked = false;
try {
  cursorAgentsMd({ id: 'x', name: 'x', description: 'd', roles: [{ name: '../evil', description: 'd', systemPrompt: 's' }] });
} catch {
  crNameBlocked = true;
}
assert.ok(crNameBlocked, 'Cursor 역할 이름 경로조작 차단');
ok('Cursor 보안: 역할 이름 경로조작 차단');

// 20) 정합성 불변식: 여러 팀이 같은 MCP id를 선언하면 installSpec이 완전히 동일해야 한다.
//     (동일해야만 Claude Code dedup이 안전. 어긋나면 두 서버 동시 로드 → 이름 충돌·비결정. 07_ISSUE_context7-MCP-중복.md S1)
const seenSpec = new Map();
for (const p of PRESETS) {
  for (const t of p.tools || []) {
    const spec = JSON.stringify({ c: t.installSpec.command, a: t.installSpec.args, e: t.installSpec.env || null });
    if (seenSpec.has(t.id)) {
      assert.equal(spec, seenSpec.get(t.id), `MCP "${t.id}" 스펙이 팀마다 다름(dedup 깨짐 위험)`);
    } else {
      seenSpec.set(t.id, spec);
    }
  }
}
ok('정합성: 공유 MCP(context7) 스펙이 모든 팀에서 동일(dedup 안전 불변식)');

// 21) Phase 3 M1: 신규 프리셋 2종(보안 감사팀·DevOps/배포팀) — 존재·카테고리·실제 설치까지 검증
const sat = getPreset('security-audit-team');
assert.ok(sat, '보안 감사팀 프리셋 존재');
assert.equal(sat.roles.length, 3, '보안 감사팀 역할 3개');
assert.deepEqual(
  sat.roles.map((r) => r.name),
  ['security-auditor', 'vulnerability-analyst', 'compliance-reviewer'],
  '보안 감사팀 역할 이름·순서'
);
assert.equal(presetsInCategory('보안').length, 1, '보안 카테고리 1건');
assert.equal(presetsInCategory('보안')[0].id, 'security-audit-team', '보안 카테고리=보안 감사팀');

const dvt = getPreset('devops-team');
assert.ok(dvt, 'DevOps/배포팀 프리셋 존재');
assert.equal(dvt.roles.length, 3, 'DevOps/배포팀 역할 3개');
assert.deepEqual(
  dvt.roles.map((r) => r.name),
  ['deploy-engineer', 'cicd-manager', 'infra-troubleshooter'],
  'DevOps/배포팀 역할 이름·순서'
);
assert.equal(presetsInCategory('인프라').length, 1, '인프라 카테고리 1건');
assert.equal(presetsInCategory('인프라')[0].id, 'devops-team', '인프라 카테고리=DevOps/배포팀');
ok('M1 신규 프리셋: 보안 감사팀·DevOps/배포팀이 정본에 존재하고 카테고리로 정확히 조회됨');

const satTarget = path.join(root, 'security-audit-install');
fs.mkdirSync(satTarget, { recursive: true });
applyPlan(buildPlan(sat, resolveTarget(satTarget)));
for (const r of sat.roles) {
  assert.ok(
    fs.existsSync(path.join(satTarget, '.claude', 'agents', `${r.name}.md`)),
    `보안 감사팀 설치: ${r.name}.md 실제 생성`
  );
}
const dvtTarget = path.join(root, 'devops-install');
fs.mkdirSync(dvtTarget, { recursive: true });
applyPlan(buildPlan(dvt, resolveTarget(dvtTarget)));
for (const r of dvt.roles) {
  assert.ok(
    fs.existsSync(path.join(dvtTarget, '.claude', 'agents', `${r.name}.md`)),
    `DevOps/배포팀 설치: ${r.name}.md 실제 생성`
  );
}
ok('M1 신규 프리셋: 실제 설치 시 두 팀 모두 .claude/agents/*.md가 빠짐없이 생성됨(목업 아님)');

// 22) 신규 프리셋 3종(고객지원팀·PM/제품관리팀·번역/로컬라이제이션팀) — 존재·카테고리·실제 설치까지 검증
const newTeams = [
  { id: 'customer-support-team', category: '고객지원', roles: ['support-agent', 'faq-writer', 'feedback-analyst'] },
  { id: 'pm-team', category: '제품관리', roles: ['requirements-analyst', 'roadmap-planner', 'meeting-scribe'] },
  { id: 'localization-team', category: '번역', roles: ['translator', 'localization-specialist', 'terminology-reviewer'] },
];
for (const t of newTeams) {
  const preset = getPreset(t.id);
  assert.ok(preset, `${t.id} 프리셋 존재`);
  assert.equal(preset.roles.length, 3, `${t.id} 역할 3개`);
  assert.deepEqual(preset.roles.map((r) => r.name), t.roles, `${t.id} 역할 이름·순서`);
  assert.equal(presetsInCategory(t.category).length, 1, `${t.category} 카테고리 1건`);
  assert.equal(presetsInCategory(t.category)[0].id, t.id, `${t.category} 카테고리=${t.id}`);
}
ok('신규 프리셋 3종: 정본에 존재하고 카테고리로 정확히 조회됨(고객지원·제품관리·번역)');

for (const t of newTeams) {
  const preset = getPreset(t.id);
  const target = path.join(root, `${t.id}-install`);
  fs.mkdirSync(target, { recursive: true });
  applyPlan(buildPlan(preset, resolveTarget(target)));
  for (const r of preset.roles) {
    assert.ok(
      fs.existsSync(path.join(target, '.claude', 'agents', `${r.name}.md`)),
      `${t.id} 설치: ${r.name}.md 실제 생성`
    );
  }
}
ok('신규 프리셋 3종: 실제 설치 시 전부 .claude/agents/*.md가 빠짐없이 생성됨(목업 아님)');

console.log(`\n🎉 모든 검증 통과: ${pass}건`);
fs.rmSync(root, { recursive: true, force: true });
console.log('임시 폴더 정리 완료.');
