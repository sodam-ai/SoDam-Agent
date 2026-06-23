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

  // 전역(mcpPath 없음)은 사용자 MCP 설정을 자동으로 건드리지 않는다 → 표시(안내)만 한다.
  if (!target.mcpPath) {
    const manualMcp = (preset.tools || []).map((t) => {
      assertSafeName(t.id, 'MCP id');
      const s = t.installSpec || {};
      return { id: t.id, command: [s.command, ...(s.args || [])].join(' ') };
    });
    return { preset, target, agents, mcpExisting: null, newServers: {}, manualMcp };
  }

  const mcpExisting = readJsonSafe(target.mcpPath);
  const newServers = {};
  for (const t of preset.tools || []) {
    assertSafeName(t.id, 'MCP id');
    if (!mcpExisting?.mcpServers?.[t.id]) newServers[t.id] = t.installSpec;
  }
  return { preset, target, agents, mcpExisting, newServers, manualMcp: [] };
}

// 설치 전 사용자에게 보여줄 미리보기(명령 주입 방지의 핵심 — 실제 명령을 그대로 노출).
export function printPlan(plan) {
  const isGlobal = plan.target.scope === 'global';
  line('\n' + color.bold('📋 설치 미리보기 (아직 아무것도 바꾸지 않았습니다)'));
  if (isGlobal) {
    line(color.gray('   대상: ') + color.bold('전역(모든 폴더 공용)') + color.gray(`  ${plan.target.agentDir}`));
    line(color.yellow('   ⚠️ 전역 설치 — 모든 프로젝트에서 보입니다. 같은 이름이 있으면 덮어씁니다(먼저 백업).'));
  } else {
    line(color.gray(`   대상 폴더: ${plan.target.projectRoot}`));
  }

  const overwrites = plan.agents.filter((a) => a.exists);
  line('\n' + color.bold('   ① 만들 에이전트(직원) 파일:'));
  for (const a of plan.agents) {
    const tag = a.exists ? color.yellow('[기존 덮어씀·백업됨]') : color.green('[새로 만듦]');
    line(`      ${tag} ${a.name}.md`);
  }
  if (isGlobal && overwrites.length) {
    line(
      color.yellow(
        `      → 덮어쓰는 기존 전역 역할 ${overwrites.length}개: ${overwrites.map((a) => a.name).join(', ')}  (백업 후 진행 · rollback으로 복구 가능)`
      )
    );
  }

  line('\n' + color.bold('   ② 연결할 MCP:'));
  if (isGlobal) {
    if (plan.manualMcp && plan.manualMcp.length) {
      line(color.gray('      전역은 안전을 위해 MCP를 자동 연결하지 않습니다. 필요하면 직접 추가하세요(선택):'));
      for (const m of plan.manualMcp) line(`      • ${color.cyan(m.id)} → ${color.bold(m.command)}`);
    } else {
      line(color.gray('      (이 팀은 MCP가 없습니다)'));
    }
  } else {
    const ids = Object.keys(plan.newServers);
    line(color.gray('      설치될 실제 명령(꼭 확인하세요):'));
    if (ids.length === 0) {
      line(color.gray('      (추가할 MCP 없음 — 이미 있거나 프리셋에 없음)'));
    } else {
      for (const id of ids) {
        const s = plan.newServers[id];
        const cmd = [s.command, ...(s.args || [])].join(' ');
        line(`      • ${color.cyan(id)} → ${color.bold(cmd)}`);
      }
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
  const banner = '\n# SoDam-Agent (백업·비밀 포함 가능 — Git에 올리지 않음)\n';
  fs.appendFileSync(gi, banner + '.agentroster/\n');
}

// 실제 적용: 백업 → 에이전트 쓰기 → MCP 병합 → 설치기록 저장.
export function applyPlan(plan) {
  const { target, agents, newServers, preset } = plan;
  // 전역은 같은 폴더에 에이전트가 매우 많을 수 있으니 '건드리는 파일'만 백업한다.
  const onlyAgents = target.scope === 'global' ? agents.map((a) => `${a.name}.md`) : null;
  const backup = createBackup(target, onlyAgents ? { onlyAgents } : {});

  fs.mkdirSync(target.agentDir, { recursive: true });
  const added = [];
  const overwritten = [];
  for (const a of agents) {
    (a.exists ? overwritten : added).push(`${a.name}.md`);
    writeAtomic(a.file, a.content);
  }

  let mcpExistedBefore = false;
  if (target.mcpPath) {
    mcpExistedBefore = fs.existsSync(target.mcpPath);
    if (Object.keys(newServers).length > 0) {
      const cur = mcpExistedBefore ? JSON.parse(fs.readFileSync(target.mcpPath, 'utf8')) : {};
      cur.mcpServers = cur.mcpServers || {};
      for (const [id, spec] of Object.entries(newServers)) {
        if (!cur.mcpServers[id]) cur.mcpServers[id] = spec; // 기존 서버는 절대 덮지 않음
      }
      writeAtomic(target.mcpPath, JSON.stringify(cur, null, 2) + '\n');
    }
  }

  const record = {
    presetId: preset.id,
    installedAt: new Date().toISOString(),
    scope: target.scope,
    addedAgents: added,
    overwrittenAgents: overwritten,
    mcpAdded: Object.keys(newServers),
    mcpExistedBefore,
  };
  fs.writeFileSync(path.join(backup.dest, 'install-record.json'), JSON.stringify(record, null, 2));

  // 전역은 홈 폴더에 .gitignore를 만들지 않는다(프로젝트만 백업 폴더 Git 제외).
  if (target.scope !== 'global') ensureGitignore(target.projectRoot);
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
    scope: target.scope,
    agents: listInstalledAgents(target),
    hasMcp: target.mcpPath ? fs.existsSync(target.mcpPath) : false,
  };
}
