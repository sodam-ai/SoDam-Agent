// AgentRoster 메인 흐름. 인자 없으면 대화형 메뉴, 있으면 명령 실행.
import path from 'node:path';
import { PRESETS, getPreset, getRoleLibrary, getToolLibrary } from './presets.mjs';
import { toSafeName } from './validate.mjs';
import { resolveTarget } from './paths.mjs';
import { buildPlan, printPlan, applyPlan, verifyInfo } from './install.mjs';
import { listBackups, restoreBackup } from './backup.mjs';
import { buildExport, writeExport, readImport } from './share.mjs';
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
      return cmdList();
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
  const opts = { dir: undefined, out: undefined, yes: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') opts.yes = true;
    else if (a === '--dir') opts.dir = argv[++i];
    else if (a.startsWith('--dir=')) opts.dir = a.slice(6);
    else if (a === '--out') opts.out = argv[++i];
    else if (a.startsWith('--out=')) opts.out = a.slice(6);
    else positional.push(a);
  }
  return { cmd: positional[0], arg2: positional[1], opts };
}

function banner() {
  line(color.bold('\n  AgentRoster') + color.gray('  — Claude Code에 에이전트 팀을 깔아주는 도구'));
  line(color.gray('  ────────────────────────────────────────────'));
}

function printHelp() {
  banner();
  line(`
  사용법:
    agentroster                 대화형 메뉴 (가장 쉬움)
    agentroster doctor          환경 진단
    agentroster list            프리셋(팀) 목록
    agentroster install <팀id>  팀 설치 (예: install web-app-team)
    agentroster custom          역할을 골라 나만의 팀 만들기(마법사)
    agentroster roles           내 역할 만들기/고치기/지우기
    agentroster verify          설치 상태 + Claude Code에서 확인하는 법 보기
    agentroster rollback        되돌리기(가장 최근 백업)
    agentroster export <팀id>   팀을 파일로 내보내기(공유용)
    agentroster import <파일>   받은 팀 파일을 설치

  옵션:
    --dir <폴더>   설치/확인할 프로젝트 폴더 (기본: 현재 폴더)
    --out <파일>   내보내기 파일 경로 (기본: <팀id>.agentroster.json)
    --yes, -y      확인 질문 없이 진행
`);
}

function cmdList() {
  banner();
  line(color.bold('  설치할 수 있는 팀(프리셋):\n'));
  for (const p of PRESETS) {
    line(`  • ${color.cyan(p.id)}  ${color.bold(p.name)}`);
    line(color.gray(`      ${p.description}`));
    line(color.gray(`      역할: ${p.roles.map((r) => r.name).join(', ')}`));
    line('');
  }
}

async function pickPreset(promptText) {
  const id = await ui.selectFromList(
    promptText,
    PRESETS.map((p) => ({ label: `${p.name} (${p.id})`, value: p.id, hint: p.description }))
  );
  return getPreset(id);
}

// 기본 역할 + 내가 만든 역할을 합친다(같은 이름이면 내 역할 우선).
function fullRoleLibrary() {
  const personal = listPersonalRoles();
  const seen = new Set(personal.map((r) => r.name));
  return [...personal, ...getRoleLibrary().filter((r) => !seen.has(r.name))];
}

async function cmdInstall(opts) {
  const target = resolveTarget(opts.dir);
  let preset = opts.preset ? getPreset(opts.preset) : null;
  if (opts.preset && !preset) {
    ui.warn(`그런 팀이 없습니다: ${opts.preset}.  'agentroster list'로 목록을 보세요.`);
    return;
  }
  if (!preset) preset = await pickPreset('어떤 팀을 설치할까요?');

  const plan = buildPlan(preset, target);
  printPlan(plan);

  if (!opts.yes) {
    const go = await ui.confirm('위 내용으로 설치할까요? (기존 설정은 먼저 백업됩니다)', false);
    if (!go) {
      ui.info('취소했습니다. 아무것도 바꾸지 않았습니다.');
      return;
    }
  }

  const { backup } = applyPlan(plan);
  ui.success(`'${preset.name}' 설치 완료!`);
  printAfterInstall(backup, target, preset.roles[0]?.name);
}

// ⭐ 설치 후 "마지막 한 단계" 안내 — 비개발자가 가장 많이 막히는 지점이라 강하게 안내한다.
function printAfterInstall(backup, target, sampleRole = 'reviewer') {
  line(color.gray(`   백업 위치: .agentroster/backups/${backup.id}  (되돌리기로 복구 가능)`));
  line('');
  ui.warn('마지막 한 단계 — 이게 제일 중요합니다!');
  line(`   새로 깐 에이전트는 ${color.bold('"완전히 새로 켠"')} Claude Code에서만 보입니다.`);
  line('');
  line(color.bold('   ✅ 이렇게 확인하세요:'));
  line(`   1) 이 폴더에서 Claude Code를 켜세요 → ${color.cyan(target.projectRoot)}`);
  line(color.gray('      (탐색기에서 이 폴더 → 주소창에 cmd 입력 → 검은 창에 claude 입력)'));
  line(`   2) ${color.red('이전 대화가 그대로 보이면 "이어하기"라 안 보입니다!')} 텅 빈 새 창이어야 해요.`);
  line(`   3) 새 창에서 ${color.bold('/agents')} 또는 ${color.bold(`"${sampleRole} 에이전트 불러줘"`)} 로 확인.`);
  line('');
  line(color.gray('   언제든 "agentroster verify" 로 설치 상태와 확인법을 다시 볼 수 있어요.'));
  line('');
}

function cmdVerify(opts) {
  const target = resolveTarget(opts.dir);
  const info = verifyInfo(target);
  banner();
  line(color.bold(`  🔎 설치 확인 — 폴더: ${info.projectRoot}\n`));

  if (info.agents.length === 0) {
    ui.info('이 폴더엔 설치된 에이전트(팀)가 없습니다.');
    line(color.gray('   먼저 "agentroster install <팀id>" 또는 메뉴에서 설치하세요.'));
    line(color.gray('   (혹시 다른 폴더에 깔았다면: agentroster verify --dir "그 폴더 경로")'));
    return;
  }

  line(color.bold('  설치된 에이전트(직원):'));
  for (const a of info.agents) {
    line(`   • ${color.cyan(a.name)}   ${color.gray('(.claude/agents/' + a.file + ')')}`);
  }
  line(color.gray(`   MCP 설정(.mcp.json): ${info.hasMcp ? '있음' : '없음'}`));
  line('');
  line(color.bold('  ⭐ Claude Code에서 진짜 보이는지 확인하는 법:'));
  line('   1) 이 폴더에서 Claude Code를 ' + color.bold('완전히 새로') + ' 켜세요.');
  line(color.gray('      (탐색기에서 이 폴더 → 주소창에 cmd → claude)'));
  line(`   2) ${color.red('이전 대화가 보이면 "이어하기"라 새 직원이 안 보입니다.')} 텅 빈 새 창이어야 함.`);
  line(`   3) 새 창에서 ${color.bold('/agents')} 또는 ${color.bold(`"${info.agents[0].name} 에이전트 불러줘"`)} 로 위 이름이 보이는지 확인.`);
  line('');
}

async function cmdRollback(opts) {
  const target = resolveTarget(opts.dir);
  const backups = listBackups(target);
  if (backups.length === 0) {
    ui.info('되돌릴 백업이 없습니다(아직 설치 기록 없음).');
    return;
  }
  let chosen = backups[0];
  if (!opts.yes) {
    const id = await ui.selectFromList(
      '어느 시점으로 되돌릴까요? (최신이 위)',
      backups.map((b) => ({ label: b.id, value: b.id, hint: `${(b.files || []).length}개 원본 보관` }))
    );
    chosen = backups.find((b) => b.id === id);
    const go = await ui.confirm(`'${chosen.id}' 시점으로 되돌릴까요?`, false);
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
  const target = resolveTarget(opts.dir);
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

  const plan = buildPlan(preset, target);
  printPlan(plan);
  if (!opts.yes) {
    const go = await ui.confirm('이 팀으로 설치할까요? (기존 설정은 먼저 백업됩니다)', false);
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
  let preset = opts.preset ? getPreset(opts.preset) : null;
  if (opts.preset && !preset) {
    ui.warn(`그런 팀이 없습니다: ${opts.preset}.  'agentroster list'로 목록을 보세요.`);
    return;
  }
  if (!preset) preset = await pickPreset('어떤 팀을 파일로 내보낼까요?');

  const obj = buildExport(preset);
  const out = path.resolve(opts.dir || process.cwd(), opts.out || `${preset.id}.agentroster.json`);
  writeExport(obj, out);
  ui.success(`'${preset.name}' 팀을 파일로 내보냈습니다.`);
  line(color.gray(`   파일: ${out}`));
  line('   이 파일을 다른 사람에게 주면, 그 사람도 `agentroster import` 로 같은 팀을 설치할 수 있어요.');
  line(color.gray('   (비밀번호·API 키 값은 들어있지 않습니다 — 안전하게 공유 가능.)'));
}

async function cmdImport(opts) {
  if (!opts.file) {
    ui.warn('가져올 파일 경로를 알려주세요. 예: agentroster import 내팀.agentroster.json');
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

  ui.warn('이 파일은 외부에서 온 것일 수 있습니다. 아래 "설치될 명령"을 꼭 확인하세요.');
  const plan = buildPlan(preset, target);
  printPlan(plan);

  if (!opts.yes) {
    const go = await ui.confirm('위 내용을 신뢰하고 설치할까요? (기존 설정은 먼저 백업됩니다)', false);
    if (!go) {
      ui.info('취소했습니다. 아무것도 바꾸지 않았습니다.');
      return;
    }
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
      { label: '팀 설치하기', value: 'install', hint: '프리셋 팀을 골라 설치' },
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
