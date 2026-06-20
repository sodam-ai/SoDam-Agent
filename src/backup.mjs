// 백업·되돌리기 — 우리 제품의 1순위 해자(01_PRD §1). 모든 쓰기 전 자동 백업, 원클릭 복구.
import fs from 'node:fs';
import path from 'node:path';

function timestampId() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `bk-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${p(d.getMilliseconds(), 3)}`;
}

// 설치 직전 현재 상태(.mcp.json + agents/*.md)를 사본 보관.
// opts.onlyAgents: 주어지면 그 파일들만 백업(전역처럼 같은 폴더에 에이전트가 매우 많을 때
//   '건드리는 파일'만 보관해 통째 복사를 피한다). 없으면 폴더의 모든 .md 백업(프로젝트 기본).
export function createBackup(target, opts = {}) {
  const { agentDir, mcpPath, backupRoot } = target;
  const onlyAgents = opts.onlyAgents || null;
  // 고유 ID 보장: 같은 밀리초에 두 번 백업해도 서로 덮어쓰지 않게 충돌 시 번호를 붙인다.
  const base = timestampId();
  let id = base;
  let dest = path.join(backupRoot, id);
  let n = 1;
  while (fs.existsSync(dest)) {
    id = `${base}-${++n}`;
    dest = path.join(backupRoot, id);
  }
  fs.mkdirSync(dest, { recursive: true });
  const files = [];

  if (mcpPath && fs.existsSync(mcpPath)) {
    fs.copyFileSync(mcpPath, path.join(dest, '.mcp.json'));
    files.push('.mcp.json');
  }
  if (fs.existsSync(agentDir)) {
    let agents = fs.readdirSync(agentDir).filter((f) => f.endsWith('.md'));
    if (onlyAgents) agents = agents.filter((f) => onlyAgents.includes(f));
    if (agents.length) {
      fs.mkdirSync(path.join(dest, 'agents'), { recursive: true });
      for (const a of agents) {
        fs.copyFileSync(path.join(agentDir, a), path.join(dest, 'agents', a));
        files.push('agents/' + a);
      }
    }
  }

  const manifest = { id, createdAt: new Date().toISOString(), files };
  fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { id, dest, files };
}

export function listBackups(target) {
  const { backupRoot } = target;
  if (!fs.existsSync(backupRoot)) return [];
  return fs
    .readdirSync(backupRoot)
    .filter((d) => fs.existsSync(path.join(backupRoot, d, 'manifest.json')))
    .sort()
    .reverse() // 최신 먼저
    .map((id) => JSON.parse(fs.readFileSync(path.join(backupRoot, id, 'manifest.json'), 'utf8')));
}

// 진짜 되돌리기: 설치가 '새로 추가'한 파일은 삭제하고, '덮어쓴' 원본은 백업에서 복원.
export function restoreBackup(target, id) {
  const { agentDir, mcpPath, backupRoot } = target;
  const dest = path.join(backupRoot, id);
  if (!fs.existsSync(path.join(dest, 'manifest.json'))) {
    throw new Error(`백업을 찾을 수 없습니다: ${id}`);
  }
  const recordPath = path.join(dest, 'install-record.json');
  const record = fs.existsSync(recordPath)
    ? JSON.parse(fs.readFileSync(recordPath, 'utf8'))
    : null;

  // 1) 설치가 새로 추가한 에이전트 파일 제거
  if (record) {
    for (const f of record.addedAgents || []) {
      const p = path.join(agentDir, f);
      if (fs.existsSync(p)) fs.rmSync(p);
    }
    // 설치가 .mcp.json을 '없던 상태에서 새로 만든' 경우 → 그 파일 자체를 제거
    const backupHasMcp = fs.existsSync(path.join(dest, '.mcp.json'));
    if (mcpPath && record.mcpExistedBefore === false && !backupHasMcp && fs.existsSync(mcpPath)) {
      fs.rmSync(mcpPath);
    }
  }

  // 2) 백업에 있던 원본 복원(덮어썼던 것)
  const bkMcp = path.join(dest, '.mcp.json');
  if (mcpPath && fs.existsSync(bkMcp)) fs.copyFileSync(bkMcp, mcpPath);
  const bkAgents = path.join(dest, 'agents');
  if (fs.existsSync(bkAgents)) {
    fs.mkdirSync(agentDir, { recursive: true });
    for (const a of fs.readdirSync(bkAgents)) {
      fs.copyFileSync(path.join(bkAgents, a), path.join(agentDir, a));
    }
  }
  return record || { id };
}
