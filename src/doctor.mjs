// 진단(doctor) — 설치 전 환경 점검. 비개발자 첫 단계 막힘 방지(Node·Claude Code·쓰기권한·기존설정).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { color, line, success, warn, info } from './ui.mjs';

export function runDoctor(target) {
  line('\n' + color.bold('🩺 진단(doctor) — 설치 전에 환경을 점검합니다'));

  // 1) Node 버전
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 18) success(`Node.js ${process.versions.node} (요구: 18 이상) — 정상`);
  else warn(`Node.js ${process.versions.node} — 18 이상을 권장합니다. https://nodejs.org 에서 설치하세요.`);

  // 2) Claude Code 감지(있으면 좋고, 없어도 설치는 됨)
  // Windows에서 claude는 claude.cmd/claude.ps1이라 셸 없이는 execFile이 못 찾음 → shell로 실행해야 오탐이 없음.
  try {
    const out = execFileSync('claude', ['--version'], {
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: process.platform === 'win32',
    })
      .toString()
      .trim();
    success(`Claude Code 감지됨 (${out})`);

    // 2-1) 플러그인(/plugin) 기능 지원 여부 — 버전 숫자를 추측해서 비교하지 않고
    // 실제 능력(claude plugin --help 성공 여부)을 직접 확인한다(README "구버전" 실패 사례 대응).
    try {
      execFileSync('claude', ['plugin', '--help'], {
        timeout: 5000,
        stdio: ['ignore', 'pipe', 'ignore'],
        shell: process.platform === 'win32',
      });
      success('플러그인(/plugin) 기능 지원됨 — 마켓플레이스 설치 방식을 쓸 수 있습니다');
    } catch {
      warn('이 Claude Code는 플러그인(/plugin) 기능을 지원하지 않는 것 같습니다. 최신 버전으로 업데이트하세요(문서: code.claude.com).');
    }
  } catch {
    info('Claude Code를 자동 감지하지 못했습니다(설치 안 됐거나 PATH에 없음). 설치는 진행할 수 있으며, 에이전트는 Claude Code에서 사용합니다.');
  }

  // 3) 대상 폴더 쓰기 권한
  try {
    fs.mkdirSync(target.projectRoot, { recursive: true });
    const probe = path.join(target.projectRoot, '.agentroster-write-test');
    fs.writeFileSync(probe, 'ok');
    fs.rmSync(probe);
    success(`설치 폴더 쓰기 가능 — ${target.projectRoot}`);
  } catch {
    warn(`설치 폴더에 쓸 수 없습니다: ${target.projectRoot}. 다른 폴더를 쓰거나 권한을 확인하세요.`);
  }

  // 4) 기존 설정 현황
  const hasAgents = fs.existsSync(target.agentDir) && fs.readdirSync(target.agentDir).some((f) => f.endsWith('.md'));
  const hasMcp = fs.existsSync(target.mcpPath);
  info(`기존 에이전트: ${hasAgents ? '있음(설치 시 백업 후 진행)' : '없음'} / 기존 .mcp.json: ${hasMcp ? '있음(병합)' : '없음'}`);
  line('');
}
