// AgentRoster 메인 흐름. 인자 없으면 대화형 메뉴, 있으면 명령 실행.
import { PRESETS, getPreset } from './presets.mjs';
import { resolveTarget } from './paths.mjs';
import { buildPlan, printPlan, applyPlan } from './install.mjs';
import { listBackups, restoreBackup } from './backup.mjs';
import { runDoctor } from './doctor.mjs';
import * as ui from './ui.mjs';

const { color, line } = ui;

export async function main(argv) {
  const { cmd, preset, opts } = parseArgs(argv);
  switch (cmd) {
    case undefined:
    case '':
      return interactiveMenu(opts);
    case 'doctor':
      return runDoctor(resolveTarget(opts.dir));
    case 'list':
      return cmdList();
    case 'install':
      return cmdInstall({ ...opts, preset });
    case 'rollback':
      return cmdRollback(opts);
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
  const opts = { dir: undefined, yes: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--yes' || a === '-y') opts.yes = true;
    else if (a === '--dir') opts.dir = argv[++i];
    else if (a.startsWith('--dir=')) opts.dir = a.slice(6);
    else positional.push(a);
  }
  return { cmd: positional[0], preset: positional[1], opts };
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
    agentroster rollback        되돌리기(가장 최근 백업)

  옵션:
    --dir <폴더>   설치할 프로젝트 폴더 (기본: 현재 폴더)
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

async function cmdInstall(opts) {
  const target = resolveTarget(opts.dir);
  let preset = opts.preset ? getPreset(opts.preset) : null;
  if (opts.preset && !preset) {
    ui.warn(`그런 팀이 없습니다: ${opts.preset}.  'agentroster list'로 목록을 보세요.`);
    return;
  }
  if (!preset) {
    const id = await ui.selectFromList(
      '어떤 팀을 설치할까요?',
      PRESETS.map((p) => ({ label: `${p.name} (${p.id})`, value: p.id, hint: p.description }))
    );
    preset = getPreset(id);
  }

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
  line(color.gray(`   백업 위치: .agentroster/backups/${backup.id}  (되돌리기로 복구 가능)`));
  line('');
  ui.warn('중요: 새로 깐 에이전트는 "완전히 새 창"에서만 보입니다.');
  line('   → Claude Code를 완전히 종료하고 다시 켜세요(화면이 텅 빈 새 창이어야 함).');
  line(`   → 그 다음 예: "${color.bold('reviewer 에이전트로 이 코드 검토해줘')}"`);
  line('');
}

async function cmdRollback(opts) {
  const target = resolveTarget(opts.dir);
  const backups = listBackups(target);
  if (backups.length === 0) {
    ui.info('되돌릴 백업이 없습니다(아직 설치 기록 없음).');
    return;
  }
  let chosen = backups[0]; // 최신
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

async function interactiveMenu(opts) {
  banner();
  // 진입 시 한 번 가볍게 진단
  runDoctor(resolveTarget(opts.dir));
  while (true) {
    const choice = await ui.selectFromList('무엇을 할까요?', [
      { label: '팀 설치하기', value: 'install', hint: '프리셋 팀을 골라 설치' },
      { label: '되돌리기', value: 'rollback', hint: '설치 전 상태로 복구' },
      { label: '팀 목록 보기', value: 'list', hint: '설치 가능한 팀' },
      { label: '진단 다시 하기', value: 'doctor', hint: '환경 점검' },
      { label: '끝내기', value: 'quit' },
    ]);
    if (choice === 'quit') {
      ui.info('안녕히 가세요!');
      return;
    }
    if (choice === 'install') await cmdInstall(opts);
    else if (choice === 'rollback') await cmdRollback(opts);
    else if (choice === 'list') cmdList();
    else if (choice === 'doctor') runDoctor(resolveTarget(opts.dir));
  }
}
