// Codex 역할 번역(Phase 2-a) — 같은 팀 정의(presets.mjs)를 Codex가 읽는 형식으로 변환.
// 출력(PRD 04_PROJECT_SPEC): AGENTS.md(역할=모드) + .agents/skills/<role>/SKILL.md + ~/.codex/config.toml(TOML, 수동).
// ⚠️ PRD §0 최대 리스크: Codex엔 멀티에이전트 개념이 없음 → "똑같은 팀"이 아니라 "역할 번역"(베타).
//    config.toml(전역·민감)은 자동 수정하지 않고 스니펫만 안내한다(전역 안전 원칙, 01_PRD §8).
import fs from 'node:fs';
import path from 'node:path';
import { validatePreset, assertSafeName } from '../validate.mjs';

const ATTRIBUTION = 'SoDam-Agent 자체 큐레이션';

// 역할 1개 → .agents/skills/<role>/SKILL.md 본문(frontmatter + 지시문)
export function skillMd(role) {
  assertSafeName(role.name, '역할 이름');
  return [
    '---',
    `name: ${role.name}`,
    `description: ${role.description}`,
    '---',
    '',
    (role.systemPrompt || '').trim(),
    '',
  ].join('\n');
}

// 팀 → AGENTS.md (역할을 "모드"로 번역 + Codex 한계 정직 고지)
export function agentsMd(preset) {
  validatePreset(preset);
  const lines = [
    `# ${preset.name} (${preset.id})`,
    '',
    `> ${preset.description}`,
    `> 출처: ${ATTRIBUTION} · SoDam-Agent가 Codex용으로 번역(베타).`,
    '',
    '## ⚠️ 알아두기 (정직한 한계)',
    'Codex에는 Claude Code 같은 "여러 에이전트가 따로 도는 팀" 개념이 없습니다.',
    '아래는 **같은 팀이 아니라**, 각 역할을 Codex 방식(지침 + 스킬)으로 **번역**한 것입니다.',
    '컨텍스트 격리·병렬 협업은 없으며, 필요한 역할을 골라 그 지침대로 작업을 요청하세요.',
    '각 역할의 상세 지시문은 `.agents/skills/<역할>/SKILL.md` 에 있습니다.',
    '',
    '## 역할(모드)',
  ];
  for (const r of preset.roles) {
    assertSafeName(r.name, '역할 이름');
    lines.push('');
    lines.push(`### ${r.name}`);
    lines.push(`- 언제: ${r.description}`);
    if (r.allowedTools && r.allowedTools.length) lines.push(`- 도구(권장): ${r.allowedTools.join(', ')}`);
    lines.push(`- 지침: ${(r.systemPrompt || '').trim()}`);
  }
  const tools = preset.tools || [];
  lines.push('', '## MCP 도구');
  if (tools.length) {
    lines.push('아래 MCP는 `~/.codex/config.toml` 에 직접 추가하세요(설치 시 안내된 TOML 스니펫 사용):');
    for (const t of tools) lines.push(`- ${t.name} (${t.id})`);
  } else {
    lines.push('(이 팀은 MCP가 없습니다.)');
  }
  lines.push('');
  return lines.join('\n');
}

// 팀 → ~/.codex/config.toml 용 MCP 스니펫(TOML). 비밀 값은 절대 안 적고 키 이름만(빈 문자열).
export function codexConfigToml(preset) {
  const tools = preset.tools || [];
  const blocks = [];
  for (const t of tools) {
    assertSafeName(t.id, 'MCP id');
    const s = t.installSpec || {};
    const b = [`[mcp_servers.${t.id}]`];
    if (s.command) b.push(`command = ${JSON.stringify(s.command)}`);
    const args = s.args || [];
    b.push(`args = [${args.map((a) => JSON.stringify(a)).join(', ')}]`);
    if (s.env && Object.keys(s.env).length) {
      b.push(`[mcp_servers.${t.id}.env]`);
      for (const k of Object.keys(s.env)) {
        if (/^[A-Za-z0-9_]+$/.test(k)) b.push(`${k} = ""  # 값은 OS 환경변수에 설정(여기에 비밀 적지 마세요)`);
      }
    }
    blocks.push(b.join('\n'));
  }
  return blocks.join('\n\n');
}

function writeAtomic(file, content) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, file); // tmp→rename: 도중에 끊겨도 원본이 깨지지 않음
}

// 무엇을 어디에 쓸지 계산만(아무것도 안 바꿈).
export function buildCodexPlan(preset, dir) {
  validatePreset(preset);
  const root = path.resolve(dir || process.cwd());
  const agentsFile = path.join(root, 'AGENTS.md');
  const skills = preset.roles.map((r) => {
    assertSafeName(r.name, '역할 이름');
    const sdir = path.join(root, '.agents', 'skills', r.name);
    return { role: r.name, dir: sdir, file: path.join(sdir, 'SKILL.md'), content: skillMd(r) };
  });
  return {
    preset,
    root,
    agentsFile,
    agentsContent: agentsMd(preset),
    agentsExists: fs.existsSync(agentsFile),
    skills,
    tomlSnippet: codexConfigToml(preset),
  };
}

// 실제 적용: 기존 AGENTS.md 백업(.bak) → AGENTS.md + 스킬 원자적 쓰기. (config.toml은 자동 수정 안 함 — 스니펫만 반환)
export function applyCodexPlan(plan) {
  if (plan.agentsExists) fs.copyFileSync(plan.agentsFile, plan.agentsFile + '.bak'); // 비가역 보호
  fs.mkdirSync(plan.root, { recursive: true });
  writeAtomic(plan.agentsFile, plan.agentsContent);
  for (const s of plan.skills) {
    fs.mkdirSync(s.dir, { recursive: true });
    writeAtomic(s.file, s.content);
  }
  return {
    agentsFile: plan.agentsFile,
    backup: plan.agentsExists ? plan.agentsFile + '.bak' : null,
    skills: plan.skills.map((s) => s.file),
    tomlSnippet: plan.tomlSnippet,
  };
}
