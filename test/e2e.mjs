// 자동 e2e 검증 — "빌드 통과 ≠ 작동". 실제 파일 쓰기·병합·멱등성·되돌리기를 임시 폴더에서 확인.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { resolveTarget } from '../src/paths.mjs';
import { getPreset } from '../src/presets.mjs';
import { buildPlan, applyPlan } from '../src/install.mjs';
import { listBackups, restoreBackup } from '../src/backup.mjs';
import { isSafeName } from '../src/validate.mjs';

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

console.log(`\n🎉 모든 검증 통과: ${pass}건`);
fs.rmSync(root, { recursive: true, force: true });
console.log('임시 폴더 정리 완료.');
