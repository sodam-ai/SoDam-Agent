// Gemini CLI 역할 변환(Phase 3 M2, 베타) — 같은 팀 정의(presets.mjs)를 Gemini CLI 서브에이전트 형식으로 변환.
// 형식 근거(2026-07-11 공식 문서 실확인 — 추측 아님): https://geminicli.com/docs/core/subagents/
//   .gemini/agents/<role>.md, frontmatter: name(필수)·description(필수)·tools(선택, 생략=전체 상속)·
//   model(선택, 기본 inherit) 등. 본문 = 시스템 프롬프트. Claude Code의 .claude/agents/<name>.md와
//   구조가 거의 동일해 Codex처럼 "역할=모드 묶음"이 아니라 역할 1개=파일 1개로 직접 매핑 가능.
//
// ⚠️ 정직한 한계 (완전한 기능 X — 01_PRD §0 원칙 계승, Codex 번역과 동일한 신중함):
//  1) 도구 제한: Gemini 문서의 예시 tools 값(read_file·grep_search 등)은 Claude Code 도구명
//     (Read/Grep/Glob/Write/Edit/Bash)과 다른 체계다. 신뢰할 수 있는 전체 매핑표를 확보하지 못한
//     채 옮기면 존재하지 않는 도구명을 적어 깨질 위험이 있어 — tools 필드는 생성하지 않는다
//     (Gemini 문서상 생략=전체 도구 상속이 기본값이라 안전한 쪽으로 넘어감. 최소권한 정밀 제어는
//     이 버전에서 보류 — 추측으로 매핑표를 만들지 않는다).
//  2) MCP: mcpServers를 파일 안에 직접 넣는 필드가 문서에 있지만, 같은 MCP를 여러 역할 파일에
//     반복 선언했을 때 Gemini CLI가 실제로 어떻게 처리하는지(dedup/중복 허용/오류)는 실측 전이라
//     자동 쓰기 대신 Codex와 같은 원칙(전역·불확실 영역은 안내만)으로 스니펫만 제공한다.
import fs from 'node:fs';
import path from 'node:path';
import { validatePreset, assertSafeName } from '../validate.mjs';

// 역할 1개 → .gemini/agents/<role>.md 본문(frontmatter + 지시문)
export function geminiAgentMd(role) {
  assertSafeName(role.name, '역할 이름');
  const lines = ['---', `name: ${role.name}`, `description: ${role.description}`, 'model: inherit', '---', ''];
  if (Array.isArray(role.disallowedTools) && role.disallowedTools.length) {
    lines.push(
      `> ⚠️ 이 역할은 Claude Code에서 일부 도구(${role.disallowedTools.join(', ')})를 금지했지만,`,
      '> Gemini CLI 스키마는 금지목록을 지원하지 않아 여기서는 전체 도구를 상속합니다(정직한 한계).',
      ''
    );
  }
  lines.push((role.systemPrompt || '').trim(), '');
  return lines.join('\n');
}

// 팀 → MCP 스니펫(YAML, mcpServers 필드용 안내). 자동 삽입 안 함 — 미리보기·수동 추가용.
// 비밀 값은 절대 안 적고 키 이름만.
export function geminiMcpSnippet(preset) {
  const tools = preset.tools || [];
  if (!tools.length) return '';
  const blocks = [];
  for (const t of tools) {
    assertSafeName(t.id, 'MCP id');
    const s = t.installSpec || {};
    const lines = ['mcpServers:', `  ${t.id}:`];
    if (s.command) lines.push(`    command: ${JSON.stringify(s.command)}`);
    const args = s.args || [];
    lines.push(`    args: [${args.map((a) => JSON.stringify(a)).join(', ')}]`);
    if (s.env && Object.keys(s.env).length) {
      lines.push('    env:');
      for (const k of Object.keys(s.env)) {
        if (/^[A-Za-z0-9_]+$/.test(k)) lines.push(`      ${k}: ""  # 값은 OS 환경변수에 설정(여기에 비밀 적지 마세요)`);
      }
    }
    blocks.push(lines.join('\n'));
  }
  return blocks.join('\n\n');
}

function writeAtomic(file, content) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, file); // tmp→rename: 도중에 끊겨도 원본이 깨지지 않음
}

// 무엇을 어디에 쓸지 계산만(아무것도 안 바꿈).
export function buildGeminiPlan(preset, dir) {
  validatePreset(preset);
  const root = path.resolve(dir || process.cwd());
  const agentsDir = path.join(root, '.gemini', 'agents');
  const roles = preset.roles.map((r) => {
    assertSafeName(r.name, '역할 이름');
    const file = path.join(agentsDir, `${r.name}.md`);
    return { name: r.name, file, exists: fs.existsSync(file), content: geminiAgentMd(r) };
  });
  return {
    preset,
    root,
    agentsDir,
    roles,
    mcpSnippet: geminiMcpSnippet(preset),
  };
}

// 실제 적용: 기존 역할 파일은 .bak로 백업 후 원자적 쓰기. (mcpServers는 자동 삽입 안 함 — 스니펫만 반환)
export function applyGeminiPlan(plan) {
  fs.mkdirSync(plan.agentsDir, { recursive: true });
  const backups = [];
  for (const r of plan.roles) {
    if (r.exists) {
      fs.copyFileSync(r.file, r.file + '.bak');
      backups.push(r.file + '.bak');
    }
    writeAtomic(r.file, r.content);
  }
  return {
    agentsDir: plan.agentsDir,
    files: plan.roles.map((r) => r.file),
    backups,
    mcpSnippet: plan.mcpSnippet,
  };
}
