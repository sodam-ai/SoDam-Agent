// 설치 로직 — 미리보기(plan) → 적용(apply). 적용 전 반드시 백업.
import fs from 'node:fs';
import path from 'node:path';
import { createBackup } from './backup.mjs';
import { validatePreset, assertSafeName } from './validate.mjs';
import { color, line } from './ui.mjs';

// 역할 1개 → .claude/agents/<name>.md 본문(frontmatter + 시스템 프롬프트)
export function agentFileContent(role) {
  const fm = [
    '---',
    `name: ${role.name}`,
    `description: ${role.description}`,
    role.allowedTools && role.allowedTools.length ? `tools: ${role.allowedTools.join(', ')}` : null,
    `model: ${role.model || 'inherit'}`,
    '---',
    '',
    role.systemPrompt.trim(),
    '',
  ].filter((x) => x !== null);
  return fm.join('\n');
}

function readJsonSafe(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    throw new Error(
      `기존 ${path.basename(p)} 파일이 손상되어 읽을 수 없습니다. 안전을 위해 설치를 중단합니다. ` +
        `(파일을 직접 고치거나 다른 곳으로 옮긴 뒤 다시 시도하세요.)`
    );
  }
}

// 무엇을 어디에 쓸지 계산만 한다(아무것도 안 바꿈).
export function buildPlan(preset, target) {
  validatePreset(preset);
  const agents = preset.roles.map((r) => {
    const file = path.join(target.agentDir, `${r.name}.md`);
    return { name: r.name, file, exists: fs.existsSync(file), content: agentFileContent(r) };
  });
  const mcpExisting = readJsonSafe(target.mcpPath);
  const newServers = {};
  for (const t of preset.tools || []) {
    assertSafeName(t.id, 'MCP id');
    if (!mcpExisting?.mcpServers?.[t.id]) newServers[t.id] = t.installSpec;
  }
  return { preset, target, agents, mcpExisting, newServers };
}

// 설치 전 사용자에게 보여줄 미리보기(명령 주입 방지의 핵심 — 실제 명령을 그대로 노출).
export function printPlan(plan) {
  line('\n' + color.bold('📋 설치 미리보기 (아직 아무것도 바꾸지 않았습니다)'));
  line(color.gray(`   대상 폴더: ${plan.target.projectRoot}`));
  line('\n' + color.bold('   ① 만들 에이전트(직원) 파일:'));
  for (const a of plan.agents) {
    const tag = a.exists ? color.yellow('[기존 덮어씀·백업됨]') : color.green('[새로 만듦]');
    line(`      ${tag} .claude/agents/${a.name}.md`);
  }
  const ids = Object.keys(plan.newServers);
  line('\n' + color.bold('   ② 연결할 MCP — 설치될 실제 명령(꼭 확인하세요):'));
  if (ids.length === 0) {
    line(color.gray('      (추가할 MCP 없음 — 이미 있거나 프리셋에 없음)'));
  } else {
    for (const id of ids) {
      const s = plan.newServers[id];
      const cmd = [s.command, ...(s.args || [])].join(' ');
      line(`      • ${color.cyan(id)} → ${color.bold(cmd)}`);
    }
  }
  line('');
}

function writeAtomic(file, content) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, file); // tmp→rename: 도중에 끊겨도 원본이 깨지지 않음
}

function ensureGitignore(root) {
  const gi = path.join(root, '.gitignore');
  const cur = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
  if (cur.includes('.agentroster/')) return;
  const banner = '\n# AgentRoster (백업·비밀 포함 가능 — Git에 올리지 않음)\n';
  fs.appendFileSync(gi, banner + '.agentroster/\n');
}

// 실제 적용: 백업 → 에이전트 쓰기 → MCP 병합 → 설치기록 저장.
export function applyPlan(plan) {
  const { target, agents, newServers, preset } = plan;
  const backup = createBackup(target);

  fs.mkdirSync(target.agentDir, { recursive: true });
  const added = [];
  const overwritten = [];
  for (const a of agents) {
    (a.exists ? overwritten : added).push(`${a.name}.md`);
    writeAtomic(a.file, a.content);
  }

  const mcpExistedBefore = fs.existsSync(target.mcpPath);
  if (Object.keys(newServers).length > 0) {
    const cur = mcpExistedBefore ? JSON.parse(fs.readFileSync(target.mcpPath, 'utf8')) : {};
    cur.mcpServers = cur.mcpServers || {};
    for (const [id, spec] of Object.entries(newServers)) {
      if (!cur.mcpServers[id]) cur.mcpServers[id] = spec; // 기존 서버는 절대 덮지 않음
    }
    writeAtomic(target.mcpPath, JSON.stringify(cur, null, 2) + '\n');
  }

  const record = {
    presetId: preset.id,
    installedAt: new Date().toISOString(),
    addedAgents: added,
    overwrittenAgents: overwritten,
    mcpAdded: Object.keys(newServers),
    mcpExistedBefore,
  };
  fs.writeFileSync(path.join(backup.dest, 'install-record.json'), JSON.stringify(record, null, 2));

  ensureGitignore(target.projectRoot);
  return { backup, record };
}

// 읽기 전용: 해당 폴더에 설치된 에이전트 목록을 frontmatter의 name 기준으로 읽는다.
export function listInstalledAgents(target) {
  if (!fs.existsSync(target.agentDir)) return [];
  return fs
    .readdirSync(target.agentDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const txt = fs.readFileSync(path.join(target.agentDir, f), 'utf8');
      const m = txt.match(/^name:\s*(.+)$/m);
      return { file: f, name: m ? m[1].trim() : f.replace(/\.md$/, '') };
    });
}

// 읽기 전용: 설치 확인용 요약 정보.
export function verifyInfo(target) {
  return {
    projectRoot: target.projectRoot,
    agents: listInstalledAgents(target),
    hasMcp: fs.existsSync(target.mcpPath),
  };
}
