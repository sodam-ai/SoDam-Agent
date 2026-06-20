// 입력 검증 — 경로 조작·명령 주입을 막는 1차 방어선 (01_PRD §8).
// 역할/팀 이름이 그대로 파일명이 되므로 화이트리스트만 허용한다.

// 소문자+숫자+하이픈, 1~50자, 시작/끝 하이픈 금지, 연속 하이픈 금지.
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSafeName(name) {
  return typeof name === 'string' && name.length >= 1 && name.length <= 50 && NAME_RE.test(name);
}

export function assertSafeName(name, kind = '이름') {
  if (!isSafeName(name)) {
    throw new Error(
      `안전하지 않은 ${kind}: "${name}". 소문자·숫자·하이픈만 허용됩니다(경로 조작 방지).`
    );
  }
}

// 프리셋(또는 가져온 팀)의 기본 구조를 검증한다. 신뢰 못 할 입력 전제.
export function validatePreset(p) {
  if (!p || typeof p !== 'object') throw new Error('프리셋 형식이 올바르지 않습니다.');
  assertSafeName(p.id, '프리셋 id');
  if (!Array.isArray(p.roles) || p.roles.length === 0) {
    throw new Error('프리셋에 역할(roles)이 없습니다.');
  }
  for (const r of p.roles) {
    assertSafeName(r.name, '역할 이름');
    if (!r.description || !r.systemPrompt) {
      throw new Error(`역할 "${r.name}"에 description/systemPrompt가 필요합니다.`);
    }
    for (const t of (r.allowedTools || [])) {
      if (typeof t !== 'string' || !/^[A-Za-z0-9_]+$/.test(t)) {
        throw new Error(`역할 "${r.name}"의 도구 이름이 올바르지 않습니다: ${t}`);
      }
    }
  }
  for (const tool of (p.tools || [])) {
    assertSafeName(tool.id, 'MCP id');
    const spec = tool.installSpec;
    if (!spec || typeof spec.command !== 'string' || !spec.command) {
      throw new Error(`MCP "${tool.id}"에 실행 명령(command)이 필요합니다.`);
    }
    if (spec.args && !Array.isArray(spec.args)) {
      throw new Error(`MCP "${tool.id}"의 args는 목록이어야 합니다.`);
    }
  }
  return true;
}
