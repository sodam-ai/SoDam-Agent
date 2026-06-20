// 설치 대상 경로 계산. MVP는 '프로젝트 설치'만 지원(가장 안전한 기본값, 01_PRD §8).
// 전역(~/.claude) 설치는 ~/.claude.json 등 사용자 전역 설정을 건드릴 위험이 커서 후속 단계로 미룬다.
import path from 'node:path';

export function resolveTarget(dir) {
  const projectRoot = path.resolve(dir || process.cwd());
  const claudeDir = path.join(projectRoot, '.claude');
  return {
    projectRoot,
    agentDir: path.join(claudeDir, 'agents'),   // 에이전트 파일(.md) 위치
    mcpPath: path.join(projectRoot, '.mcp.json'), // MCP 설정(프로젝트)
    backupRoot: path.join(projectRoot, '.agentroster', 'backups'),
    scope: 'project',
  };
}
