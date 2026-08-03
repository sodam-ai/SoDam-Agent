// 화면 출력·입력 도우미 (외부 라이브러리 없이 Node 내장 readline 사용).
// 비개발자 친화: 번호 입력식 메뉴(화살표 메뉴는 후속 폴리시 @clack/prompts로 교체 예정).
import readline from 'node:readline';

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (n) => (s) => (useColor ? `\x1b[${n}m${s}\x1b[0m` : String(s));
export const color = {
  bold: wrap(1), dim: wrap(2), red: wrap(31), green: wrap(32),
  yellow: wrap(33), cyan: wrap(36), gray: wrap(90),
};

export function line(s = '') { console.log(s); }
export function success(s) { line(color.green('✅ ' + s)); }
export function info(s) { line(color.cyan('ℹ️  ' + s)); }
export function warn(s) { line(color.yellow('⚠️  ' + s)); }
export function danger(s) { line(color.red('🛑 ' + s)); }

let _rl = null;
function getRL() {
  if (!_rl) {
    _rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  }
  return _rl;
}

// 세션 전체에서 readline 인터페이스 하나만 재사용한다.
// (질문마다 새로 만들었다 닫으면, 파이프/리다이렉트된 비대화형 표준입력에서
//  먼저 만든 인터페이스가 뒤쪽 줄까지 미리 버퍼링했다가 닫히며 유실하는 문제가 있었음.)
// CLI 종료 시 closeUI()를 반드시 호출해야 프로세스가 정상 종료된다.
// ⚠️ 정직한 한계(2026-07-12 확인, 완전 해결 아님): 이 재사용 구조로도
// 파이프 입력이 한 번에 전부 도착해 스트림이 끝나버리면, 두 번째 이후
// question()이 응답을 영영 못 받는 Node readline 자체의 더 근본적인 제약이
// 남아있다(최소 재현 스크립트로 확인됨). 실제 사람이 터미널에 직접 타이핑하는
// 주 사용 시나리오(및 플러그인 마켓플레이스 설치 경로)는 영향 밖으로 보이나
// 확인은 못 했다. 비대화형/자동화 설치를 지원해야 한다면 프롬프트가 아니라
// --yes 같은 명시적 CLI 플래그로 우회하는 것이 근본 해법이다(별도 작업 필요).
export function closeUI() {
  if (_rl) {
    _rl.close();
    _rl = null;
  }
}

// 한 줄 입력 받기
export async function ask(question, def = '') {
  const rl = getRL();
  const a = await new Promise((res) => {
    let done = false;
    // 표준입력이 응답 없이 끝나면(파이프/자동화 EOF) readline이 'close'를 낸다.
    // 이전엔 이 경우 question()의 콜백이 영영 안 불려 프로세스가 조용히 끝났다(함정#11).
    // res('')로 흘려보내면 selectFromList/selectMultiple의 while(true) 검증 루프가
    // 이미 죽은 rl에 다시 question()을 걸어 "취소되었습니다"를 무한 반복 출력하며
    // 멈추는 새 버그가 생긴다(직접 재현 확인) — 그래서 여기서 바로 안전하게 종료한다.
    const onClose = () => {
      if (done) return;
      done = true;
      warn('입력이 더 들어오지 않아 작업을 취소합니다.');
      process.exit(0);
    };
    rl.once('close', onClose);
    rl.question(question, (answer) => {
      if (done) return;
      done = true;
      rl.removeListener('close', onClose);
      res(answer);
    });
  });
  return (a || '').trim() || def;
}

// 예/아니오 확인 (위험 작업 게이트에 사용)
export async function confirm(question, def = false) {
  const hint = def ? '[Y/n]' : '[y/N]';
  const a = (await ask(`${question} ${hint} `)).toLowerCase();
  if (!a) return def;
  return a === 'y' || a === 'yes' || a === '예' || a === 'ㅇ';
}

// 비가역(전역) 작업 전용 게이트 — y/n이 아니라 정확히 "YES"를 입력해야 진행.
// 전역(~/.claude 등) 변경은 모든 프로젝트에 영향을 주고 되돌리기 부담이 커서
// 일반 확인보다 더 무겁게 만든다(01_PRD §8 Should-Have: 비가역 작업 게이트).
export async function confirmYes(question) {
  danger(question);
  const a = await ask(color.gray('   계속하려면 정확히 ') + color.bold('YES') + color.gray(' 라고 입력하세요(취소하려면 Enter): '));
  return a === 'YES';
}

// 번호로 고르는 메뉴. items: [{ label, value, hint }]
export async function selectFromList(title, items) {
  line('\n' + color.bold(title));
  items.forEach((it, i) => {
    const num = color.cyan(String(i + 1).padStart(2));
    const hint = it.hint ? color.gray('  — ' + it.hint) : '';
    line(`  ${num}. ${it.label}${hint}`);
  });
  while (true) {
    const a = await ask('\n번호를 입력하세요: ');
    const n = Number(a);
    if (Number.isInteger(n) && n >= 1 && n <= items.length) return items[n - 1].value;
    warn(`1 ~ ${items.length} 사이의 번호를 입력해 주세요.`);
  }
}

// 여러 개를 쉼표로 고르는 메뉴. items: [{ label, value, hint }] → 고른 value 배열 반환.
export async function selectMultiple(title, items, { min = 1 } = {}) {
  line('\n' + color.bold(title));
  items.forEach((it, i) => {
    const num = color.cyan(String(i + 1).padStart(2));
    const hint = it.hint ? color.gray('  — ' + it.hint) : '';
    line(`  ${num}. ${it.label}${hint}`);
  });
  while (true) {
    const a = await ask('\n넣고 싶은 번호들을 쉼표로 입력 (예: 1,3,4): ');
    const nums = [...new Set(a.split(/[,\s]+/).filter(Boolean).map(Number))];
    const ok = nums.length >= min && nums.every((n) => Number.isInteger(n) && n >= 1 && n <= items.length);
    if (ok) return nums.map((n) => items[n - 1].value);
    warn(`1 ~ ${items.length} 사이의 번호를 쉼표로 ${min}개 이상 입력해 주세요.`);
  }
}
