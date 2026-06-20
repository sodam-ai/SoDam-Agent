// 설치 대상 경로 계산.
//  - project(기본): 현재 폴더의 .claude/agents — 그 폴더에서만 보임(가장 안전).
//  - global(--global): ~/.claude/agents — 한 번 깔면 모든 폴더에서 보임(공용).
// 전역은 사용자 MCP(~/.claude.json)를 자동으로 건드리지 않는다(mcpPath=null) → 설정 손상 위험 차단.
import path from 'node:path';
import os from 'node:os';

// 테스트 격리용: AGENTROSTER_HOME가 있으면 그곳을 홈으로 취급(실사용에선 미설정 → 진짜 홈).
function homeBase() {
  return process.env.AGENTROSTER_HOME || os.homedir();
}

export function resolveTarget(dir, opts = {}) {
  if (opts.global) {
    const base = homeBase();
    const claudeDir = path.join(base, '.claude');
    return {
      projectRoot: claudeDir, // 표시·기준용
      agentDir: path.join(claudeDir, 'agents'), // 모든 폴더 공용 에이전트 위치
      mcpPath: null, // 전역은 .mcp.json 자동 병합 안 함(안전)
      backupRoot: path.join(base, '.agentroster', 'backups'),
      scope: 'global',
    };
  }
  const projectRoot = path.resolve(dir || process.cwd());
  const claudeDir = path.join(projectRoot, '.claude');
  return {
    projectRoot,
    agentDir: path.join(claudeDir, 'agents'), // 에이전트 파일(.md) 위치
    mcpPath: path.join(projectRoot, '.mcp.json'), // MCP 설정(프로젝트)
    backupRoot: path.join(projectRoot, '.agentroster', 'backups'),
    scope: 'project',
  };
}
