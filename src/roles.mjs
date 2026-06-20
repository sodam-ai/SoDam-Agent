// 내 역할(에이전트) 라이브러리 — 사용자가 직접 만든 역할을 홈 폴더에 보관해 어느 프로젝트에서나 재사용.
// 저장 형식 = 설치되는 에이전트 .md와 동일(그대로 팀에 쓸 수 있음).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertSafeName } from './validate.mjs';
import { agentFileContent } from './install.mjs';

// 테스트에서 격리할 수 있도록 AGENTROSTER_HOME 환경변수로 홈 위치 덮어쓰기 허용.
export function rolesDir() {
  const home = process.env.AGENTROSTER_HOME || os.homedir();
  return path.join(home, '.agentroster', 'roles');
}

function parseRoleFile(file) {
  const txt = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = txt.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const head = m ? m[1] : '';
  const body = (m ? m[2] : txt).trim();
  const get = (k) => {
    const mm = head.match(new RegExp('^' + k + ':\\s*(.+)$', 'm'));
    return mm ? mm[1].trim() : '';
  };
  const tools = get('tools');
  return {
    name: get('name') || path.basename(file, '.md'),
    description: get('description') || '',
    systemPrompt: body,
    allowedTools: tools ? tools.split(',').map((s) => s.trim()).filter(Boolean) : [],
    model: get('model') || 'inherit',
    _personal: true,
  };
}

export function listPersonalRoles() {
  const dir = rolesDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => parseRoleFile(path.join(dir, f)));
}

export function saveRole(role) {
  assertSafeName(role.name, '역할 이름'); // 파일명이 되므로 화이트리스트 검증(경로 조작 차단)
  if (!role.description || !role.systemPrompt) {
    throw new Error('역할에는 설명과 "하는 일(지시문)"이 필요합니다.');
  }
  const dir = rolesDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, role.name + '.md');
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, agentFileContent(role), 'utf8');
  fs.renameSync(tmp, file); // 원자적 쓰기
  return file;
}

export function removeRole(name) {
  assertSafeName(name, '역할 이름');
  const file = path.join(rolesDir(), name + '.md');
  if (!fs.existsSync(file)) throw new Error(`그런 역할이 없습니다: ${name}`);
  fs.rmSync(file);
  return file;
}
