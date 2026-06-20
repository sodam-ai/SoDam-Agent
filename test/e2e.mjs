// 자동 e2e 검증 — "빌드 통과 ≠ 작동". 실제 파일 쓰기·병합·멱등성·되돌리기를 임시 폴더에서 확인.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { resolveTarget } from '../src/paths.mjs';
import { getPreset, getRoleLibrary } from '../src/presets.mjs';
import { buildPlan, applyPlan, verifyInfo } from '../src/install.mjs';
import { listBackups, restoreBackup } from '../src/backup.mjs';
import { isSafeName, toSafeName } from '../src/validate.mjs';
import { buildExport, writeExport, readImport } from '../src/share.mjs';
import { rolesDir, listPersonalRoles, saveRole, removeRole } from '../src/roles.mjs';

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

console.log(`\n🎉 모든 검증 통과: ${pass}건`);
fs.rmSync(root, { recursive: true, force: true });
console.log('임시 폴더 정리 완료.');
