// 팀 내보내기/가져오기 (Phase 2 — 공유). 01_PRD §8: 가져온 파일은 '신뢰 못 할 입력' 전제로 검증.
import fs from 'node:fs';
import { validatePreset } from './validate.mjs';

const FORMAT = 'agentroster-team';
const VERSION = 1;
const MAX_BYTES = 256 * 1024; // 가져오기 크기 제한(폭주/손상 방지)

// env 객체에서 '값'은 버리고 '키 이름'만 남긴다(비밀 절대 미포함).
function sanitizeEnvKeys(env) {
  if (!env || typeof env !== 'object') return {};
  const out = {};
  for (const k of Object.keys(env)) out[k] = '';
  return out;
}

// 프리셋/팀 → 공유용 객체(비밀 미포함, 알려진 필드만)
export function buildExport(preset) {
  validatePreset(preset);
  return {
    format: FORMAT,
    version: VERSION,
    id: preset.id,
    name: preset.name || preset.id,
    description: preset.description || '',
    roles: preset.roles.map((r) => ({
      name: r.name,
      description: r.description,
      systemPrompt: r.systemPrompt,
      allowedTools: r.allowedTools || [],
      model: r.model || 'inherit',
    })),
    tools: (preset.tools || []).map((t) => ({
      id: t.id,
      type: t.type || 'mcp',
      name: t.name || t.id,
      requirement: t.requirement || 'optional',
      installSpec: {
        command: t.installSpec.command,
        args: t.installSpec.args || [],
        env: sanitizeEnvKeys(t.installSpec.env),
      },
    })),
  };
}

export function writeExport(obj, outPath) {
  const tmp = outPath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, outPath);
  return outPath;
}

// 가져오기: 파일 → 검증·정화된 preset 형태. 모든 단계가 안전 실패(throw)하도록.
export function readImport(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`파일을 찾을 수 없습니다: ${filePath}`);
  const size = fs.statSync(filePath).size;
  if (size > MAX_BYTES) {
    throw new Error(`파일이 너무 큽니다(${Math.round(size / 1024)}KB > 256KB). 안전을 위해 가져오기를 중단합니다.`);
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    throw new Error('파일이 올바른 형식이 아닙니다(JSON 읽기 실패). 가져오기를 중단합니다.');
  }
  if (!raw || raw.format !== FORMAT) {
    throw new Error('SoDam-Agent 팀 파일이 아닙니다(format 불일치). 가져오기를 중단합니다.');
  }
  if (raw.version !== VERSION) {
    throw new Error(`지원하지 않는 버전입니다(version=${raw.version}). 가져오기를 중단합니다.`);
  }
  if (!Array.isArray(raw.roles) || raw.roles.length === 0) {
    throw new Error('역할(roles)이 없습니다. 가져오기를 중단합니다.');
  }

  // 정화: 알려진 필드만 취하고 env 값은 제거(비밀 차단)
  const preset = {
    id: raw.id,
    name: raw.name || raw.id,
    description: raw.description || '',
    roles: raw.roles.map((r) => ({
      name: r && r.name,
      description: r && r.description,
      systemPrompt: r && r.systemPrompt,
      allowedTools: r && Array.isArray(r.allowedTools) ? r.allowedTools : [],
      model: (r && r.model) || 'inherit',
    })),
    tools: (raw.tools || []).map((t) => ({
      id: t && t.id,
      type: (t && t.type) || 'mcp',
      name: (t && t.name) || (t && t.id),
      requirement: (t && t.requirement) || 'optional',
      installSpec: {
        command: t && t.installSpec ? t.installSpec.command : undefined,
        args: t && t.installSpec && Array.isArray(t.installSpec.args) ? t.installSpec.args : [],
        env: sanitizeEnvKeys(t && t.installSpec ? t.installSpec.env : null),
      },
    })),
  };

  // 화이트리스트·스키마 검증(이름→파일경로 조작 차단, command 필수 등). 통과 못 하면 throw.
  validatePreset(preset);
  return preset;
}
