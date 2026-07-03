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

// 사용자가 자유 입력한 이름(한글·공백·특수문자 포함)을 안전한 식별자로 정화한다.
// 소문자+숫자+하이픈만 남김. 결과가 비면 호출부에서 기본값으로 대체.
export function toSafeName(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 50);
}

// 역할 1개 → agents/<name>.md에 쓸 권한 frontmatter 한 줄(또는 없음).
// disallowedTools(금지목록)가 있으면 그 줄만, 없고 allowedTools(허용목록)가 있으면
// tools: 줄만 쓴다. 둘 다 없으면 null(권한 줄 생략 — 상위 세션을 제한 없이 상속).
// install.mjs(CLI 직접 설치)·plugin-sync.mjs(마켓플레이스 플러그인) 두 곳이 이 함수를
// 공유해야 한다 — 각자 따로 구현하면 한쪽만 고쳤을 때 조용히 어긋난다(2026-07-04 실측 버그).
export function agentPermissionLine(role) {
  if (Array.isArray(role.disallowedTools) && role.disallowedTools.length) {
    return `disallowedTools: ${role.disallowedTools.join(', ')}`;
  }
  if (Array.isArray(role.allowedTools) && role.allowedTools.length) {
    return `tools: ${role.allowedTools.join(', ')}`;
  }
  return null;
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
    for (const t of [...(r.allowedTools || []), ...(r.disallowedTools || [])]) {
      // 하이픈·끝 와일드카드(*) 허용: 플러그인 MCP 도구명 형식(mcp__plugin_<팀>_<mcp>__*)을
      // 포함하되, 줄바꿈·콜론·따옴표 등 frontmatter 주입에 쓰일 문자는 계속 차단.
      if (typeof t !== 'string' || !/^[A-Za-z0-9_*-]+$/.test(t)) {
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
