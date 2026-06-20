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

function makeRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

// 한 줄 입력 받기
export async function ask(question, def = '') {
  const rl = makeRL();
  try {
    const a = await new Promise((res) => rl.question(question, res));
    return (a || '').trim() || def;
  } finally {
    rl.close();
  }
}

// 예/아니오 확인 (위험 작업 게이트에 사용)
export async function confirm(question, def = false) {
  const hint = def ? '[Y/n]' : '[y/N]';
  const a = (await ask(`${question} ${hint} `)).toLowerCase();
  if (!a) return def;
  return a === 'y' || a === 'yes' || a === '예' || a === 'ㅇ';
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
