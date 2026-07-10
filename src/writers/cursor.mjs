// Cursor 역할 변환(Phase 3 M2, 베타) — 같은 팀 정의(presets.mjs)를 Cursor가 읽는 형식으로 변환.
// 형식 근거(2026-07-11 공식 문서 실확인 — 추측 아님): https://cursor.com/docs/rules, https://cursor.com/docs/mcp
//   Cursor의 .cursor/rules/*.mdc는 "호출 가능한 역할"이 아니라 수동적 컨텍스트 주입이다(Manual 모드조차
//   @규칙명으로 텍스트를 끼워 넣을 뿐, 별도 역할 실행이 아님) — Claude Code 서브에이전트와 개념이 다르다.
//   반면 AGENTS.md는 공식 문서가 스스로 "`.cursor/rules`의 단순한 대안"이라 명시한다 — Codex와 동일한
//   "역할 번역"(팀 전체를 역할=모드 묶음 하나로) 모델이 정확히 들어맞아, Gemini(역할=파일)가 아니라
//   Codex(역할=모드, 단일 AGENTS.md) 패턴을 재사용한다.
//   MCP는 `.cursor/mcp.json`이 Claude Code의 `.mcp.json`과 완전히 동일한 스키마
//   ({"mcpServers":{"id":{"command","args","env"}}}) + 프로젝트 범위 파일이라, Codex(전역·자동 쓰기
//   금지)·Gemini(다중 파일 중복 미검증·안내만)와 달리 install.mjs의 검증된 안전 병합 로직(기존 서버
//   절대 안 덮음·손상 파일 안전 중단)을 그대로 재사용해 자동 연결한다.
import fs from 'node:fs';
import path from 'node:path';
import { validatePreset, assertSafeName } from '../validate.mjs';

const ATTRIBUTION = 'SoDam-Agent 자체 큐레이션';

// 팀 → AGENTS.md (역할을 "모드"로 번역 + Cursor 한계 정직 고지)
export function cursorAgentsMd(preset) {
  validatePreset(preset);
  const lines = [
    `# ${preset.name} (${preset.id})`,
    '',
    `> ${preset.description}`,
    `> 출처: ${ATTRIBUTION} · SoDam-Agent가 Cursor용으로 번역(베타).`,
    '',
    '## ⚠️ 알아두기 (정직한 한계)',
    'Cursor의 .cursor/rules는 Claude Code 같은 "호출 가능한 역할(서브에이전트)"이 아니라,',
    '조건에 따라 자동/수동으로 컨텍스트에 끼워 넣는 수동적 규칙입니다(공식 문서 확인, 2026-07-11).',
    '아래는 **같은 팀이 아니라**, 각 역할을 이 AGENTS.md 안의 "모드" 설명으로 **번역**한 것입니다.',
    '컨텍스트 격리·병렬 협업은 없으며, 필요한 역할을 골라 그 설명대로 작업을 요청하세요.',
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
    lines.push('아래 MCP는 `.cursor/mcp.json`에 자동으로 연결됩니다(설치 시 확인 후 적용).');
    for (const t of tools) lines.push(`- ${t.name} (${t.id})`);
  } else {
    lines.push('(이 팀은 MCP가 없습니다.)');
  }
  lines.push('');
  return lines.join('\n');
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

function writeAtomic(file, content) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, file); // tmp→rename: 도중에 끊겨도 원본이 깨지지 않음
}

// 무엇을 어디에 쓸지 계산만(아무것도 안 바꿈). MCP는 install.mjs#buildPlan과 동일한 원리로 미리 계산.
export function buildCursorPlan(preset, dir) {
  validatePreset(preset);
  const root = path.resolve(dir || process.cwd());
  const agentsFile = path.join(root, 'AGENTS.md');
  const mcpPath = path.join(root, '.cursor', 'mcp.json');
  const mcpExisting = readJsonSafe(mcpPath); // 손상 시 여기서 즉시 예외 → 설치 전체 중단(안전)

  const newServers = {};
  for (const t of preset.tools || []) {
    assertSafeName(t.id, 'MCP id');
    if (!mcpExisting?.mcpServers?.[t.id]) newServers[t.id] = t.installSpec;
  }

  return {
    preset,
    root,
    agentsFile,
    agentsContent: cursorAgentsMd(preset),
    agentsExists: fs.existsSync(agentsFile),
    mcpPath,
    mcpExisting,
    newServers,
  };
}

// 실제 적용: 기존 AGENTS.md는 .bak로 백업 후 원자적 쓰기 → .cursor/mcp.json 안전 병합(기존 서버 절대 안 덮음).
export function applyCursorPlan(plan) {
  if (plan.agentsExists) fs.copyFileSync(plan.agentsFile, plan.agentsFile + '.bak'); // 비가역 보호
  fs.mkdirSync(plan.root, { recursive: true });
  writeAtomic(plan.agentsFile, plan.agentsContent);

  let mcpAdded = [];
  if (Object.keys(plan.newServers).length > 0) {
    fs.mkdirSync(path.dirname(plan.mcpPath), { recursive: true });
    const cur = plan.mcpExisting || {};
    cur.mcpServers = cur.mcpServers || {};
    for (const [id, spec] of Object.entries(plan.newServers)) {
      if (!cur.mcpServers[id]) cur.mcpServers[id] = spec; // 기존 서버는 절대 덮지 않음
    }
    writeAtomic(plan.mcpPath, JSON.stringify(cur, null, 2) + '\n');
    mcpAdded = Object.keys(plan.newServers);
  }

  return {
    agentsFile: plan.agentsFile,
    backup: plan.agentsExists ? plan.agentsFile + '.bak' : null,
    mcpPath: plan.mcpPath,
    mcpAdded,
  };
}
