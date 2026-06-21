// 프리셋 단일 소스화: src/presets.mjs(유일한 정본)에서 plugins/<팀>/agents/<역할>.md 와
// plugins/<팀>/.mcp.json 을 생성한다. e2e가 "생성 결과 == 커밋된 플러그인 파일"을 검증해
// presets.mjs ↔ plugins 사이의 drift(한쪽만 고쳐 어긋남)를 차단한다.
//
// - agents/*.md  : 문자열을 정확히 생성(현재 파일과 바이트 단위 일치, LF·끝줄바꿈 1개).
// - .mcp.json    : 내용(파싱 객체)만 생성. 포맷 차이는 무시하고 내용만 비교한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRESETS } from './presets.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const PLUGINS_ROOT = path.join(here, '..', 'plugins');

// 역할 1개 → agents/<name>.md 문자열(프론트매터 + 빈 줄 + 시스템 프롬프트 + 끝 줄바꿈).
export function generateAgentMd(role) {
  return [
    '---',
    `name: ${role.name}`,
    `description: ${role.description}`,
    `tools: ${role.allowedTools.join(', ')}`,
    `model: ${role.model}`,
    '---',
    '',
    role.systemPrompt,
    '',
  ].join('\n');
}

// 팀 1개 → .mcp.json 내용 객체. MCP 도구가 없으면 null(=.mcp.json 파일 없음).
export function generateMcpServers(preset) {
  const servers = {};
  for (const t of preset.tools || []) {
    if (t.type === 'mcp') servers[t.id] = { command: t.installSpec.command, args: t.installSpec.args };
  }
  return Object.keys(servers).length ? { mcpServers: servers } : null;
}

// 정본 기준 기대 산출물 목록: [{ kind, file, content|servers }]
export function expectedPluginFiles() {
  const out = [];
  for (const preset of PRESETS) {
    for (const role of preset.roles) {
      out.push({
        kind: 'agent',
        file: path.join(PLUGINS_ROOT, preset.id, 'agents', `${role.name}.md`),
        content: generateAgentMd(role),
      });
    }
    const servers = generateMcpServers(preset);
    if (servers) {
      out.push({
        kind: 'mcp',
        file: path.join(PLUGINS_ROOT, preset.id, '.mcp.json'),
        servers,
      });
    }
  }
  return out;
}

// 정본 → 디스크에 실제 쓰기(편의용; 역할을 presets.mjs에서 고친 뒤 동기화할 때).
// agents/*.md는 문자열 그대로, .mcp.json은 현재 포맷(args 한 줄)에 맞춰 직렬화한다.
export function syncToDisk() {
  const written = [];
  for (const preset of PRESETS) {
    const agentsDir = path.join(PLUGINS_ROOT, preset.id, 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });
    for (const role of preset.roles) {
      const f = path.join(agentsDir, `${role.name}.md`);
      fs.writeFileSync(f, generateAgentMd(role));
      written.push(f);
    }
    const servers = generateMcpServers(preset);
    if (servers) {
      const f = path.join(PLUGINS_ROOT, preset.id, '.mcp.json');
      fs.writeFileSync(f, serializeMcpJson(servers));
      written.push(f);
    }
  }
  return written;
}

// 현재 커밋된 .mcp.json 포맷(args를 한 줄 배열로)에 맞춘 직렬화.
export function serializeMcpJson(obj) {
  const [id, srv] = Object.entries(obj.mcpServers)[0];
  // 현재 커밋된 포맷에 맞춰 콤마 뒤 공백 포함: ["-y", "@upstash/context7-mcp"]
  const argsLine = '[' + srv.args.map((a) => JSON.stringify(a)).join(', ') + ']';
  return (
    '{\n' +
    '  "mcpServers": {\n' +
    `    ${JSON.stringify(id)}: {\n` +
    `      "command": ${JSON.stringify(srv.command)},\n` +
    `      "args": ${argsLine}\n` +
    '    }\n' +
    '  }\n' +
    '}\n'
  );
}
