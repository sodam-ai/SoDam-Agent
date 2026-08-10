// SoDam-Agent 메인 흐름. 인자 없으면 대화형 메뉴, 있으면 명령 실행.
import path from 'node:path';
import { PRESETS, getPreset, getRoleLibrary, getToolLibrary } from './presets.mjs';
import { toSafeName } from './validate.mjs';
import { resolveTarget } from './paths.mjs';
import { buildPlan, printPlan, applyPlan, verifyInfo } from './install.mjs';
import { buildCodexPlan, applyCodexPlan } from './writers/codex.mjs';
import { buildGeminiPlan, applyGeminiPlan } from './writers/gemini.mjs';
import { buildCursorPlan, applyCursorPlan } from './writers/cursor.mjs';
import { listBackups, restoreBackup } from './backup.mjs';
import { buildExport, writeExport, readImport, checkDangerousCommands } from './share.mjs';
import { listPersonalRoles, saveRole, removeRole, rolesDir } from './roles.mjs';
import { runDoctor } from './doctor.mjs';
import * as ui from './ui.mjs';

const { color, line } = ui;

// 비개발자용 권한 묶음 — "Read/Bash" 같은 용어 대신 쉬운 3택으로.
const TOOL_PRESETS = [
  { label: '읽기만 (가장 안전 — 검토·기획에 추천)', value: ['Read', 'Grep', 'Glob'] },
  { label: '만들기 가능 (파일 수정·실행 — 개발에 추천)', value: ['Read', 'Edit', 'Write', 'Bash'] },
  { label: '전체 (모든 기본 도구 상속)', value: [] },
];

export async function main(argv) {
  const { cmd, arg2, opts } = parseArgs(argv);
  switch (cmd) {
    case undefined:
    case '':
      return interactiveMenu(opts);
    case 'doctor':
      return runDoctor(resolveTarget(opts.dir));
    case 'list':
      return cmdList(opts);
    case 'install':
      return cmdInstall({ ...opts, preset: arg2 });
    case 'custom':
      return cmdCustom(opts);
    case 'roles':
      return arg2 === 'list' ? roleList() : cmdRoles(opts);
    case 'verify':
      return cmdVerify(opts);
    case 'rollback':
      return cmdRollback(opts);
    case 'export':
      return cmdExport({ ...opts, preset: arg2 });
    case 'import':
      return cmdImport({ ...opts, file: arg2 });
    case 'help':
    case '--help':
    case '-h':
      return printHelp();
    default:
      ui.warn(`모르는 명령: ${cmd}`);
      printHelp();
  }
}

function parseArgs(argv) {
  const opts = { dir: undefined, out: undefined, yes: false, global: false, target: 'claude', category: undefined };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') opts.yes = true;
    else if (a === '--global' || a === '-g') opts.global = true;
    else if (a === '--dir') opts.dir = argv[++i];
    else if (a.startsWith('--dir=')) opts.dir = a.slice(6);
    else if (a === '--out') opts.out = argv[++i];
    else if (a.startsWith('--out=')) opts.out = a.slice(6);
    else if (a === '--target') opts.target = argv[++i];
    else if (a.startsWith('--target=')) opts.target = a.slice(9);
    else if (a === '--category') opts.category = argv[++i];
    else if (a.startsWith('--category=')) opts.category = a.slice(11);
    else positional.push(a);
  }
  return { cmd: positional[0], arg2: positional[1], opts };
}

// 카테고리 필터(순수 함수 — e2e에서 직접 테스트하기 위해 분리)
export function presetsInCategory(category) {
  return PRESETS.filter((p) => p.category === category);
}

// PRESETS 등장 순서를 유지한 채 카테고리별로 묶는다.
export function groupPresetsByCategory(presets) {
  const byCategory = new Map();
  for (const p of presets) {
    if (!byCategory.has(p.category)) byCategory.set(p.category, []);
    byCategory.get(p.category).push(p);
  }
  return byCategory;
}

function banner() {
  line(color.bold('\n  SoDam-Agent') + color.gray('  — Claude Code·Codex에 에이전트 팀을 깔아주는 도구'));
  line(color.gray('  ────────────────────────────────────────────'));
}

function printHelp() {
  banner();
  line(`
  사용법:
    sodam-agent                대화형 메뉴 (가장 쉬움)
    sodam-agent doctor          환경 진단
    sodam-agent list            프리셋(팀) 목록
    sodam-agent list --category <이름>   카테고리로 필터링해서 보기(예: 개발)
    sodam-agent install <팀id>  팀 설치 (예: install web-app-team)
    sodam-agent install <팀id> --target codex   같은 팀을 Codex용으로 번역(베타)
    sodam-agent install <팀id> --target gemini  같은 팀을 Gemini CLI용으로 번역(베타)
    sodam-agent install <팀id> --target cursor  같은 팀을 Cursor용으로 번역(베타, MCP 자동연결)
    sodam-agent custom          역할을 골라 나만의 팀 만들기(마법사)
    sodam-agent roles           내 역할 만들기/고치기/지우기
    sodam-agent verify          설치 상태 + Claude Code에서 확인하는 법 보기
    sodam-agent rollback        되돌리기(가장 최근 백업)
    sodam-agent export <팀id>   팀을 파일로 내보내기(공유용)
    sodam-agent import <파일>   받은 팀 파일을 설치

  옵션:
    --global, -g   모든 폴더에서 쓰도록 전역(~/.claude/agents) 설치/확인/되돌리기
                   (한 번 깔면 어디서나 — install·custom·verify·rollback에 사용)
    --dir <폴더>   설치/확인할 프로젝트 폴더 (기본: 현재 폴더)
    --out <파일>   내보내기 파일 경로 (기본: <팀id>.agentroster.json)
    --yes, -y      확인 질문 없이 진행 (단, import는 외부 파일이라 항상 확인받습니다)
`);
}

function cmdList(opts = {}) {
  banner();

  const presets = opts.category !== undefined ? presetsInCategory(opts.category) : PRESETS;
  if (opts.category !== undefined && presets.length === 0) {
    const categories = [...new Set(PRESETS.map((p) => p.category))];
    ui.warn(`그런 카테고리가 없습니다: ${opts.category}`);
    line(color.gray(`   가능한 카테고리: ${categories.join(', ')}`));
    return;
  }

  line(color.bold('  설치할 수 있는 팀(프리셋):\n'));
  for (const [category, group] of groupPresetsByCategory(presets)) {
    line(color.bold(`  [${category}]`));
    for (const p of group) {
      line(`  • ${color.cyan(p.id)}  ${color.bold(p.name)}`);
      line(color.gray(`      ${p.description}`));
      line(color.gray(`      역할: ${p.roles.map((r) => r.name).join(', ')}`));
      line('');
    }
  }
}

// 처음이면 뭘 고를지 몰라 압도되지 않도록, 가장 범용적인 팀 하나만 ★로 표시한다(01_PRD §3.5 골든패스).
const RECOMMENDED_PRESET_ID = 'web-app-team';

async function pickPreset(promptText) {
  const id = await ui.selectFromList(
    promptText,
    PRESETS.map((p) => ({
      label: (p.id === RECOMMENDED_PRESET_ID ? '★ ' : '') + `${p.name} (${p.id})`,
      value: p.id,
      hint: p.id === RECOMMENDED_PRESET_ID ? `${p.description} — 처음이면 추천` : p.description,
    }))
  );
  return getPreset(id);
}

// 기본 역할 + 내가 만든 역할을 합친다(같은 이름이면 내 역할 우선).
function fullRoleLibrary() {
  const personal = listPersonalRoles();
  const seen = new Set(personal.map((r) => r.name));
  return [...personal, ...getRoleLibrary().filter((r) => !seen.has(r.name))];
}

// 설치 위치 결정: 이 폴더만(project) vs 모든 폴더(global).
//  - --global 플래그가 있으면 전역. --yes(배치)는 안전하게 프로젝트 기본.
//  - 그 외 대화형이면 사용자에게 물어본다.
async function resolveScope(opts, projectRoot) {
  if (opts.global) return true;
  if (opts.yes) return false;
  const scope = await ui.selectFromList('어디에 설치할까요?', [
    { label: '이 폴더에만 (이 프로젝트 전용 · 가장 안전)', value: 'project', hint: projectRoot },
    {
      label: '모든 폴더에서 쓰기 (전역 — 한 번 깔면 어디서나)',
      value: 'global',
      hint: '~/.claude/agents · 공용이라 같은 이름이 있으면 덮어씀(백업됨)',
    },
  ]);
  return scope === 'global';
}

async function cmdInstall(opts) {
  let preset = opts.preset !== undefined ? getPreset(opts.preset) : null;
  if (opts.preset !== undefined && !preset) {
    ui.warn(`그런 팀이 없습니다: ${opts.preset}.  'sodam-agent list'로 목록을 보세요.`);
    return;
  }
  if (!preset) preset = await pickPreset('어떤 팀을 설치할까요?');

  if (opts.target && opts.target !== 'claude' && opts.target !== 'codex' && opts.target !== 'gemini' && opts.target !== 'cursor') {
    ui.warn(`모르는 대상: ${opts.target}. --target은 claude(기본)·codex·gemini·cursor만 됩니다.`);
    return;
  }
  if (opts.target === 'codex') return cmdInstallCodex(opts, preset);
  if (opts.target === 'gemini') return cmdInstallGemini(opts, preset);
  if (opts.target === 'cursor') return cmdInstallCursor(opts, preset);

  const useGlobal = await resolveScope(opts, resolveTarget(opts.dir).projectRoot);
  const target = resolveTarget(opts.dir, { global: useGlobal });

  const plan = buildPlan(preset, target);
  printPlan(plan);

  if (!opts.yes) {
    const go = target.scope === 'global'
      ? await ui.confirmYes('전역 설치 — 모든 프로젝트에 영향을 줍니다. 위 내용으로 설치할까요? (기존 설정은 먼저 백업됩니다)')
      : await ui.confirm('위 내용으로 설치할까요? (기존 설정은 먼저 백업됩니다)', false);
    if (!go) {
      ui.info('취소했습니다. 아무것도 바꾸지 않았습니다.');
      return;
    }
  }

  const { backup } = applyPlan(plan);
  ui.success(`'${preset.name}' 설치 완료!`);
  printAfterInstall(backup, target, preset.roles[0]?.name);
}

// Codex 역할 번역 설치(베타) — 같은 팀을 AGENTS.md + .agents/skills 로 변환. config.toml은 자동수정 X(스니펫 안내).
async function cmdInstallCodex(opts, preset) {
  const plan = buildCodexPlan(preset, opts.dir);
  line('\n' + color.bold('📋 Codex 설치 미리보기 (아직 아무것도 바꾸지 않았습니다)'));
  line(color.gray(`   대상 폴더: ${plan.root}`));
  line(color.yellow('   ⚠️ Codex는 멀티에이전트가 아니라 "역할 번역"입니다 — 똑같은 팀이 아니에요(베타).'));
  line('\n' + color.bold('   ① 만들/덮을 파일:'));
  line(`      ${plan.agentsExists ? color.yellow('[기존 덮어씀·.bak 백업]') : color.green('[새로 만듦]')} AGENTS.md`);
  for (const s of plan.skills) line(`      ${color.green('[새로 만듦]')} .agents/skills/${s.role}/SKILL.md`);
  line('\n' + color.bold('   ② Codex MCP') + color.gray('(=AI가 쓰는 외부 도구 연결)') + color.bold(' (자동 수정 안 함 — 직접 추가):'));
  if (plan.tomlSnippet) {
    line(color.gray('      ~/.codex/config.toml 에 아래를 직접 추가하세요:'));
    for (const ln of plan.tomlSnippet.split('\n')) line('      ' + color.cyan(ln));
  } else {
    line(color.gray('      (이 팀은 MCP가 없습니다)'));
  }
  line('');

  if (!opts.yes) {
    const go = await ui.confirm('위 내용으로 Codex용 파일을 만들까요? (기존 AGENTS.md는 .bak로 백업)', false);
    if (!go) {
      ui.info('취소했습니다. 아무것도 바꾸지 않았습니다.');
      return;
    }
  }

  const res = applyCodexPlan(plan);
  ui.success(`'${preset.name}' 팀을 Codex용으로 번역했습니다(베타).`);
  if (res.backup) line(color.gray(`   기존 AGENTS.md 백업: ${res.backup}`));
  line('');
  line(color.bold('   ✅ 다음 단계:'));
  line('   1) 이 폴더에서 Codex를 실행하면 ' + color.bold('AGENTS.md') + ' 를 읽고 역할 지침을 적용합니다.');
  if (plan.tomlSnippet) line('   2) MCP가 필요하면 위 TOML을 ' + color.bold('~/.codex/config.toml') + ' 에 추가 후 Codex 재시작.');
  line(color.gray('   ※ Codex는 역할을 "지침"으로 따릅니다(병렬 팀 아님). 실제 동작은 Codex에서 직접 확인하세요.'));
  line('');
}

// ⭐ 설치 후 "마지막 한 단계" 안내 — 비개발자가 가장 많이 막히는 지점이라 강하게 안내한다.
function printAfterInstall(backup, target, sampleRole = 'reviewer') {
  const isGlobal = target.scope === 'global';
  line(color.gray(`   백업 위치: ${backup.dest}  (되돌리기로 복구 가능)`));
  line('');
  ui.warn('마지막 한 단계 — 이게 제일 중요합니다!');
  line(`   새로 깐 에이전트는 ${color.bold('"완전히 새로 켠"')} Claude Code에서만 보입니다.`);
  line('');
  line(color.bold('   ✅ 이렇게 확인하세요:'));
  if (isGlobal) {
    line(`   1) Claude Code를 ${color.bold('완전히 종료')} 후 ${color.bold('아무 폴더에서나')} 새로 켜세요.`);
    line(color.gray('      (전역 설치라 폴더 위치와 상관없이 모든 창에서 보입니다)'));
  } else {
    line(`   1) 이 폴더에서 Claude Code를 켜세요 → ${color.cyan(target.projectRoot)}`);
    line(color.gray('      (탐색기에서 이 폴더 → 주소창에 cmd 입력 → 검은 창에 claude 입력)'));
  }
  line(`   2) ${color.red('이전 대화가 그대로 보이면 "이어하기"라 안 보입니다!')} 텅 빈 새 창이어야 해요.`);
  line(`   3) 새 창 입력창에 ${color.bold('@')} 를 입력해 자동완성에 ${color.bold(sampleRole)} 가 뜨는지 확인(또는 ${color.bold(`"${sampleRole} 에이전트 불러줘"`)} 로 확인).`);
  line('');
  line(color.gray(`   언제든 "sodam-agent verify${isGlobal ? ' --global' : ''}" 로 설치 상태와 확인법을 다시 볼 수 있어요.`));
  line('');
}

// Gemini CLI 역할 변환 설치(Phase 3 M2, 베타) — 팀을 .gemini/agents/<role>.md 여러 개로 변환.
// 도구 제한은 이번 버전에서 생성 안 함(전체 상속)·MCP는 자동 삽입 안 함(스니펫 안내) — writers/gemini.mjs 주석 참조.
async function cmdInstallGemini(opts, preset) {
  const plan = buildGeminiPlan(preset, opts.dir);
  line('\n' + color.bold('📋 Gemini CLI 설치 미리보기 (아직 아무것도 바꾸지 않았습니다)'));
  line(color.gray(`   대상 폴더: ${plan.agentsDir}`));
  line(color.yellow('   ⚠️ 도구 제한은 이번 버전에 없습니다(전체 도구 상속) — Gemini CLI 도구 이름 체계가 달라 확실한 매핑표 없이 제한하면 깨질 위험이 있습니다(베타).'));
  line('\n' + color.bold('   ① 만들/덮을 파일:'));
  for (const r of plan.roles) {
    line(`      ${r.exists ? color.yellow('[기존 덮어씀·.bak 백업]') : color.green('[새로 만듦]')} .gemini/agents/${r.name}.md`);
  }
  line('\n' + color.bold('   ② Gemini MCP') + color.gray('(=AI가 쓰는 외부 도구 연결)') + color.bold(' (자동 수정 안 함 — 직접 추가):'));
  if (plan.mcpSnippet) {
    line(color.gray('      원하는 역할 파일의 frontmatter(=파일 맨 위 설정 부분)에 아래를 직접 추가하세요:'));
    for (const ln of plan.mcpSnippet.split('\n')) line('      ' + color.cyan(ln));
  } else {
    line(color.gray('      (이 팀은 MCP가 없습니다.)'));
  }
  line('');

  if (!opts.yes) {
    const go = await ui.confirm('위 내용으로 Gemini CLI용 파일을 만들까요? (기존 파일은 .bak로 백업)', false);
    if (!go) {
      ui.info('취소했습니다. 아무것도 바꾸지 않았습니다.');
      return;
    }
  }

  const res = applyGeminiPlan(plan);
  ui.success(`'${preset.name}' 팀을 Gemini CLI용으로 번역했습니다(베타).`);
  if (res.backups.length) line(color.gray(`   백업: ${res.backups.join(', ')}`));
  line('');
  line(color.bold('   ✅ 다음 단계:'));
  line('   1) 이 폴더에서 Gemini CLI를 실행하면 ' + color.bold('.gemini/agents/') + ' 의 역할을 서브에이전트로 인식합니다.');
  if (plan.mcpSnippet) line('   2) MCP가 필요하면 위 스니펫을 원하는 역할 파일의 frontmatter에 직접 추가.');
  line(color.gray('   ※ 도구 권한은 이번 버전에서 전체 상속입니다(베타 한계). 실제 동작은 Gemini CLI에서 직접 확인하세요.'));
  line('');
}

// Cursor 역할 변환 설치(Phase 3 M2, 베타) — 팀을 AGENTS.md(역할=모드)로 변환 + MCP는 .cursor/mcp.json에
// 안전 병합(기존 서버 절대 안 덮음, install.mjs와 동일 원리) — writers/cursor.mjs 주석 참조.
async function cmdInstallCursor(opts, preset) {
  const plan = buildCursorPlan(preset, opts.dir);
  line('\n' + color.bold('📋 Cursor 설치 미리보기 (아직 아무것도 바꾸지 않았습니다)'));
  line(color.gray(`   대상 폴더: ${plan.root}`));
  line(color.yellow('   ⚠️ Cursor는 멀티에이전트가 아니라 "역할 번역"입니다 — 똑같은 팀이 아니에요(베타).'));
  line('\n' + color.bold('   ① 만들/덮을 파일:'));
  line(`      ${plan.agentsExists ? color.yellow('[기존 덮어씀·.bak 백업]') : color.green('[새로 만듦]')} AGENTS.md`);
  line('\n' + color.bold('   ② 연결할 MCP') + color.gray('(=AI가 쓰는 외부 도구 연결)') + color.bold(' (.cursor/mcp.json, 확인 후 자동 병합):'));
  const ids = Object.keys(plan.newServers);
  if (ids.length === 0) {
    const hasTools = (preset.tools || []).length > 0;
    line(color.gray(hasTools ? '      (이미 모두 설치됨 — 추가할 것 없음)' : '      (이 팀은 MCP가 없습니다)'));
  } else {
    line(color.gray('      설치될 실제 명령(꼭 확인하세요):'));
    for (const id of ids) {
      const s = plan.newServers[id];
      const cmd = [s.command, ...(s.args || [])].join(' ');
      line(`      • ${color.cyan(id)} → ${color.bold(cmd)}`);
    }
  }
  line('');

  if (!opts.yes) {
    const go = await ui.confirm('위 내용으로 Cursor용 파일을 만들까요? (기존 AGENTS.md는 .bak로 백업, MCP는 기존 설정 보존하며 병합)', false);
    if (!go) {
      ui.info('취소했습니다. 아무것도 바꾸지 않았습니다.');
      return;
    }
  }

  const res = applyCursorPlan(plan);
  ui.success(`'${preset.name}' 팀을 Cursor용으로 번역했습니다(베타).`);
  if (res.backup) line(color.gray(`   기존 AGENTS.md 백업: ${res.backup}`));
  if (res.mcpAdded.length) line(color.gray(`   MCP 연결됨(.cursor/mcp.json): ${res.mcpAdded.join(', ')}`));
  line('');
  line(color.bold('   ✅ 다음 단계:'));
  line('   1) 이 폴더에서 Cursor를 실행하면 AGENTS.md를 읽고 역할 설명을 컨텍스트로 활용합니다.');
  line(color.gray('   ※ Cursor는 역할을 "설명"으로 참고합니다(호출형 서브에이전트 아님). 실제 동작은 Cursor에서 직접 확인하세요.'));
  line('');
}

function cmdVerify(opts) {
  const isGlobal = !!opts.global;
  const target = resolveTarget(opts.dir, { global: isGlobal });
  const info = verifyInfo(target);
  banner();
  line(color.bold(`  🔎 설치 확인 — ${isGlobal ? '전역(모든 폴더): ' : '폴더: '}${info.projectRoot}\n`));

  if (info.agents.length === 0) {
    ui.info(`${isGlobal ? '전역에' : '이 폴더엔'} 설치된 에이전트(팀)가 없습니다.`);
    line(color.gray('   먼저 "sodam-agent install <팀id>" 또는 메뉴에서 설치하세요.'));
    if (!isGlobal) {
      line(color.gray('   (다른 폴더에 깔았다면: sodam-agent verify --dir "그 폴더 경로")'));
      line(color.gray('   (모든 폴더 공용으로 깔았다면: sodam-agent verify --global)'));
    }
    return;
  }

  line(color.bold('  설치된 에이전트(직원):'));
  for (const a of info.agents) {
    line(`   • ${color.cyan(a.name)}   ${color.gray('(.claude/agents/' + a.file + ')')}`);
  }
  if (!isGlobal) line(color.gray(`   MCP 설정(.mcp.json): ${info.hasMcp ? '있음' : '없음'}`));
  line('');
  line(color.bold('  ⭐ Claude Code에서 진짜 보이는지 확인하는 법:'));
  if (isGlobal) {
    line('   1) Claude Code를 ' + color.bold('완전히 종료 후 아무 폴더에서나') + ' 새로 켜세요(전역이라 위치 무관).');
  } else {
    line('   1) 이 폴더에서 Claude Code를 ' + color.bold('완전히 새로') + ' 켜세요.');
    line(color.gray('      (탐색기에서 이 폴더 → 주소창에 cmd → claude)'));
  }
  line(`   2) ${color.red('이전 대화가 보이면 "이어하기"라 새 직원이 안 보입니다.')} 텅 빈 새 창이어야 함.`);
  line(`   3) 새 창 입력창에 ${color.bold('@')} 를 입력해 자동완성에 위 이름이 뜨는지 확인(또는 ${color.bold(`"${info.agents[0].name} 에이전트 불러줘"`)} 로 확인).`);
  line('');
}

async function cmdRollback(opts) {
  const target = resolveTarget(opts.dir, { global: !!opts.global });
  const backups = listBackups(target);
  if (backups.length === 0) {
    ui.info(`되돌릴 백업이 없습니다(아직 ${opts.global ? '전역 ' : ''}설치 기록 없음).`);
    if (!opts.global) line(color.gray('   (전역 설치를 되돌리려면: sodam-agent rollback --global)'));
    return;
  }
  let chosen = backups[0];
  if (!opts.yes) {
    const id = await ui.selectFromList(
      '어느 시점으로 되돌릴까요? (최신이 위)',
      backups.map((b) => ({ label: b.id, value: b.id, hint: `${(b.files || []).length}개 원본 보관` }))
    );
    chosen = backups.find((b) => b.id === id);
    const go = opts.global
      ? await ui.confirmYes(`전역 되돌리기 — 모든 프로젝트에 영향을 줍니다. '${chosen.id}' 시점으로 되돌릴까요?`)
      : await ui.confirm(`'${chosen.id}' 시점으로 되돌릴까요?`, false);
    if (!go) {
      ui.info('취소했습니다.');
      return;
    }
  }
  restoreBackup(target, chosen.id);
  ui.success(`'${chosen.id}' 시점으로 되돌렸습니다.`);
  ui.warn('변경을 반영하려면 Claude Code를 완전히 종료 후 새 창으로 다시 켜세요.');
}

async function cmdCustom(opts) {
  banner();
  line(color.bold('  🧩 커스텀 팀 만들기 — 역할을 골라 나만의 팀을 구성합니다.\n'));

  const rawName = await ui.ask('새 팀 이름을 정해주세요 (예: 내 블로그팀): ');
  const id = toSafeName(rawName) || 'custom-team';

  const lib = fullRoleLibrary();
  const pickedNames = await ui.selectMultiple(
    '팀에 넣을 역할(AI 직원)을 고르세요',
    lib.map((r) => ({
      label: r.name + (r._personal ? color.gray(' (내 역할)') : ''),
      value: r.name,
      hint: r.description,
    }))
  );
  const roles = lib.filter((r) => pickedNames.includes(r.name));

  const tools = [];
  const toolLib = getToolLibrary();
  if (toolLib.length) {
    const useMcp = await ui.confirm(`추천 도구(MCP: ${toolLib.map((t) => t.name).join(', ')})도 연결할까요?`, false);
    if (useMcp) tools.push(...toolLib);
  }

  const preset = { id, name: (rawName || '').trim() || id, description: '커스텀 팀', roles, tools };

  const useGlobal = await resolveScope(opts, resolveTarget(opts.dir).projectRoot);
  const target = resolveTarget(opts.dir, { global: useGlobal });

  const plan = buildPlan(preset, target);
  printPlan(plan);
  if (!opts.yes) {
    const go = target.scope === 'global'
      ? await ui.confirmYes('전역 설치 — 모든 프로젝트에 영향을 줍니다. 이 팀으로 설치할까요? (기존 설정은 먼저 백업됩니다)')
      : await ui.confirm('이 팀으로 설치할까요? (기존 설정은 먼저 백업됩니다)', false);
    if (!go) {
      ui.info('취소했습니다. 아무것도 바꾸지 않았습니다.');
      return;
    }
  }
  const { backup } = applyPlan(plan);
  ui.success(`커스텀 팀 '${preset.name}' 설치 완료! (역할 ${roles.length}개)`);
  printAfterInstall(backup, target, roles[0]?.name);
}

// ── 내 역할(에이전트) 관리 ─────────────────────────────────────────────
async function cmdRoles(opts) {
  while (true) {
    const choice = await ui.selectFromList('🧑‍🔧 내 역할 관리 — 무엇을 할까요?', [
      { label: '새 역할 만들기', value: 'add' },
      { label: '역할 고치기', value: 'edit' },
      { label: '역할 지우기', value: 'remove' },
      { label: '내 역할 목록', value: 'list' },
      { label: '뒤로', value: 'back' },
    ]);
    if (choice === 'back') return;
    if (choice === 'add') await roleAdd();
    else if (choice === 'edit') await roleEdit();
    else if (choice === 'remove') await roleRemove();
    else if (choice === 'list') roleList();
  }
}

async function roleAdd(existing) {
  banner();
  line(color.bold(existing ? `  ✏️ 역할 고치기: ${existing.name}\n` : '  ➕ 새 역할 만들기\n'));

  let name;
  if (existing) {
    name = existing.name;
    line(color.gray(`   이름: ${name} (고치기에선 이름은 그대로 둡니다)`));
  } else {
    const raw = await ui.ask('   역할 이름을 정하세요 (예: SEO 전문가): ');
    name = toSafeName(raw) || 'my-role';
    if (name !== (raw || '').trim()) line(color.gray(`   → 저장용 이름: ${name}`));
  }

  line('\n   이 역할을 언제 부르나요? (예: 검색 최적화를 점검할 때)');
  const description = await ui.ask('   설명: ', existing?.description || '');
  line('\n   이 직원이 무슨 일을, 어떻게 하길 원하나요? (한 문단으로)');
  const systemPrompt = await ui.ask('   지시문: ', existing?.systemPrompt || '');

  if (!description || !systemPrompt) {
    ui.warn('설명과 지시문은 비울 수 없어요. 처음부터 다시 시도해 주세요.');
    return;
  }

  const allowedTools = await ui.selectFromList('   이 역할의 권한은?', TOOL_PRESETS);

  try {
    const file = saveRole({ name, description, systemPrompt, allowedTools, model: 'inherit' });
    ui.success(`역할 '${name}' 저장 완료!`);
    line(color.gray(`   파일: ${file}`));
    line('   이제 "나만의 팀 만들기"에서 이 역할을 고를 수 있어요.');
  } catch (e) {
    ui.danger('저장 실패: ' + (e?.message || e));
  }
}

function roleList() {
  banner();
  const roles = listPersonalRoles();
  if (!roles.length) {
    ui.info('아직 내가 만든 역할이 없습니다. "새 역할 만들기"로 추가해 보세요.');
    return;
  }
  line(color.bold('  내가 만든 역할:'));
  for (const r of roles) {
    line(`   • ${color.cyan(r.name)}  ${color.gray('— ' + (r.description || ''))}`);
  }
  line(color.gray(`\n   저장 위치: ${rolesDir()}`));
}

async function roleEdit() {
  const roles = listPersonalRoles();
  if (!roles.length) {
    ui.info('고칠 내 역할이 없습니다. 먼저 "새 역할 만들기"로 추가하세요.');
    return;
  }
  const name = await ui.selectFromList(
    '어떤 역할을 고칠까요?',
    roles.map((r) => ({ label: r.name, value: r.name, hint: r.description }))
  );
  await roleAdd(roles.find((r) => r.name === name));
}

async function roleRemove() {
  const roles = listPersonalRoles();
  if (!roles.length) {
    ui.info('지울 내 역할이 없습니다.');
    return;
  }
  const name = await ui.selectFromList(
    '어떤 역할을 지울까요?',
    roles.map((r) => ({ label: r.name, value: r.name, hint: r.description }))
  );
  const go = await ui.confirm(`'${name}' 역할을 정말 지울까요?`, false);
  if (!go) {
    ui.info('취소했습니다.');
    return;
  }
  try {
    removeRole(name);
    ui.success(`역할 '${name}' 삭제됨.`);
  } catch (e) {
    ui.danger('삭제 실패: ' + (e?.message || e));
  }
}

async function cmdExport(opts) {
  let preset = opts.preset !== undefined ? getPreset(opts.preset) : null;
  if (opts.preset !== undefined && !preset) {
    ui.warn(`그런 팀이 없습니다: ${opts.preset}.  'sodam-agent list'로 목록을 보세요.`);
    return;
  }
  if (!preset) preset = await pickPreset('어떤 팀을 파일로 내보낼까요?');

  const obj = buildExport(preset);
  const out = path.resolve(opts.dir || process.cwd(), opts.out || `${preset.id}.agentroster.json`);
  writeExport(obj, out);
  ui.success(`'${preset.name}' 팀을 파일로 내보냈습니다.`);
  line(color.gray(`   파일: ${out}`));
  line('   이 파일을 다른 사람에게 주면, 그 사람도 `sodam-agent import` 로 같은 팀을 설치할 수 있어요.');
  line(color.gray('   (비밀번호·API 키 값은 들어있지 않습니다 — 안전하게 공유 가능.)'));
}

async function cmdImport(opts) {
  if (!opts.file) {
    ui.warn('가져올 파일 경로를 알려주세요. 예: sodam-agent import 내팀.agentroster.json');
    return;
  }
  const target = resolveTarget(opts.dir);
  let preset;
  try {
    preset = readImport(path.resolve(opts.file));
  } catch (e) {
    ui.danger('가져오기 중단: ' + (e?.message || e));
    return;
  }
  for (const w of checkDangerousCommands(preset)) ui.warn(w);

  ui.warn('이 파일은 외부에서 온 것일 수 있습니다. 아래 "설치될 명령"을 꼭 확인하세요.');
  const plan = buildPlan(preset, target);
  printPlan(plan);

  // 가져온 파일은 '신뢰 못 할 입력' 전제(01_PRD §8 Must-Have) — --yes로도 확인을 건너뛰지 않는다.
  const go = await ui.confirm('위 내용을 신뢰하고 설치할까요? (기존 설정은 먼저 백업됩니다)', false);
  if (!go) {
    ui.info('취소했습니다. 아무것도 바꾸지 않았습니다.');
    return;
  }
  const { backup } = applyPlan(plan);
  ui.success(`'${preset.name}' 팀을 가져와 설치했습니다.`);
  printAfterInstall(backup, target, preset.roles[0]?.name);
}

async function interactiveMenu(opts) {
  banner();
  runDoctor(resolveTarget(opts.dir));
  while (true) {
    const choice = await ui.selectFromList('무엇을 할까요?', [
      { label: '★ 팀 설치하기', value: 'install', hint: '처음이라면 여기서 시작 — 프리셋 팀을 골라 설치' },
      { label: '나만의 팀 만들기', value: 'custom', hint: '역할을 골라 커스텀 팀 구성' },
      { label: '내 역할 관리', value: 'roles', hint: '역할 만들기/고치기/지우기' },
      { label: '설치 확인하기', value: 'verify', hint: '깔린 에이전트 + Claude Code 확인법' },
      { label: '되돌리기', value: 'rollback', hint: '설치 전 상태로 복구' },
      { label: '팀 목록 보기', value: 'list', hint: '설치 가능한 팀' },
      { label: '팀 내보내기(파일로)', value: 'export', hint: '내 팀을 파일로 저장해 공유' },
      { label: '팀 가져오기(파일에서)', value: 'import', hint: '받은 팀 파일을 설치' },
      { label: '진단 다시 하기', value: 'doctor', hint: '환경 점검' },
      { label: '끝내기', value: 'quit' },
    ]);
    if (choice === 'quit') {
      ui.info('안녕히 가세요!');
      return;
    }
    if (choice === 'install') await cmdInstall(opts);
    else if (choice === 'custom') await cmdCustom(opts);
    else if (choice === 'roles') await cmdRoles(opts);
    else if (choice === 'verify') cmdVerify(opts);
    else if (choice === 'rollback') await cmdRollback(opts);
    else if (choice === 'list') cmdList();
    else if (choice === 'export') await cmdExport(opts);
    else if (choice === 'import') {
      const f = await ui.ask('가져올 팀 파일 경로를 입력하세요: ');
      await cmdImport({ ...opts, file: f });
    } else if (choice === 'doctor') runDoctor(resolveTarget(opts.dir));
  }
}
