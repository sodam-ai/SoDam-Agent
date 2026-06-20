// AgentRoster 기본 프리셋 3종 (02_DATA_MODEL "프리셋 3종 라인업").
// 역할 1개 = .claude/agents/<name>.md 1개. tools=최소권한, model=inherit(사용자 플랜/기본 모델 따름).
// MCP는 recommendedTools 형태로, requirement=optional(없어도 동작).

export const PRESETS = [
  {
    id: 'web-app-team',
    name: '웹앱 빌드팀',
    description: '기획 → 프론트 → 백엔드 → 리뷰까지 한 팀',
    category: '개발',
    source: 'AgentRoster 자체 큐레이션',
    roles: [
      {
        name: 'planner',
        description: '요구사항을 작업으로 분해할 때',
        allowedTools: ['Read', 'Grep', 'Glob'],
        model: 'inherit',
        systemPrompt:
          '당신은 기획자입니다. 사용자의 요구사항을 작고 명확한 작업 단위로 분해하고, 우선순위와 의존성을 정리합니다. 코드를 직접 쓰기보다 "무엇을 만들지"를 또렷하게 만드는 데 집중하세요.',
      },
      {
        name: 'frontend-dev',
        description: '화면(UI)을 구현할 때',
        allowedTools: ['Read', 'Edit', 'Write', 'Bash'],
        model: 'inherit',
        systemPrompt:
          '당신은 프론트엔드 개발자입니다. 사용자에게 보이는 화면(UI)과 상호작용을 구현합니다. 접근성과 반응형(모바일 포함)을 기본으로 챙기고, 무엇을 왜 바꿨는지 짧게 설명하세요.',
      },
      {
        name: 'backend-dev',
        description: 'API·데이터 처리를 구현할 때',
        allowedTools: ['Read', 'Edit', 'Write', 'Bash'],
        model: 'inherit',
        systemPrompt:
          '당신은 백엔드 개발자입니다. API와 데이터 처리 로직을 구현합니다. 입력 검증·에러 처리·보안(비밀 노출 금지)을 기본으로 지키세요.',
      },
      {
        name: 'reviewer',
        description: '코드 품질을 검토할 때',
        allowedTools: ['Read', 'Grep', 'Glob'],
        model: 'inherit',
        systemPrompt:
          '당신은 코드 리뷰어입니다. 버그·보안·가독성·중복을 점검하고, 심각도와 함께 구체적 개선안을 제시합니다. 칭찬보다 정확한 지적에 집중하세요.',
      },
    ],
    tools: [
      {
        id: 'context7',
        type: 'mcp',
        name: 'Context7',
        requirement: 'optional',
        installSpec: { command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
      },
    ],
  },

  {
    id: 'docs-team',
    name: '문서/콘텐츠팀',
    description: '초안 → 다듬기 → 사실 확인까지 한 팀',
    category: '콘텐츠',
    source: 'AgentRoster 자체 큐레이션',
    roles: [
      {
        name: 'writer',
        description: '글 초안을 작성할 때',
        allowedTools: ['Read', 'Write'],
        model: 'inherit',
        systemPrompt:
          '당신은 작가입니다. 주제에 맞는 읽기 쉬운 초안을 빠르게 만듭니다. 완벽함보다 흐름과 핵심 전달을 우선하세요.',
      },
      {
        name: 'editor',
        description: '문장을 다듬고 일관성을 맞출 때',
        allowedTools: ['Read', 'Edit'],
        model: 'inherit',
        systemPrompt:
          '당신은 편집자입니다. 문장을 간결하고 일관되게 다듬고, 톤·용어·구조를 정리합니다. 의미를 바꾸지 않으면서 가독성을 높이세요.',
      },
      {
        name: 'fact-checker',
        description: '사실·근거를 확인할 때',
        allowedTools: ['Read', 'Grep'],
        model: 'inherit',
        systemPrompt:
          '당신은 사실 검증가입니다. 주장마다 근거가 있는지 확인하고, 불확실한 부분을 "확인 필요"로 표시합니다. 추측을 사실처럼 적지 마세요.',
      },
    ],
    tools: [],
  },

  {
    id: 'research-team',
    name: '리서치팀',
    description: '자료 수집 → 정리·종합 → 반증 검증까지 한 팀',
    category: '리서치',
    source: 'AgentRoster 자체 큐레이션',
    roles: [
      {
        name: 'researcher',
        description: '자료를 수집할 때',
        allowedTools: ['Read', 'WebSearch', 'WebFetch'],
        model: 'inherit',
        systemPrompt:
          '당신은 리서처입니다. 주제에 대한 자료를 폭넓게 수집하고 출처를 함께 기록합니다. 출처 없는 단정은 피하세요.',
      },
      {
        name: 'analyst',
        description: '수집한 자료를 정리·종합할 때',
        allowedTools: ['Read', 'Write'],
        model: 'inherit',
        systemPrompt:
          '당신은 분석가입니다. 수집된 자료를 구조화해 핵심과 시사점을 뽑아냅니다. 가설과 사실을 분리해 표시하세요.',
      },
      {
        name: 'critic',
        description: '결론을 반증·검증할 때',
        allowedTools: ['Read'],
        model: 'inherit',
        systemPrompt:
          '당신은 비평가입니다. 결론의 약점·반례·과장된 주장을 찾아 반증합니다. 동의보다 빈틈 발견에 집중하세요.',
      },
    ],
    tools: [
      {
        id: 'context7',
        type: 'mcp',
        name: 'Context7',
        requirement: 'optional',
        installSpec: { command: 'npx', args: ['-y', '@upstash/context7-mcp'] },
      },
    ],
  },
];

export function getPreset(id) {
  return PRESETS.find((p) => p.id === id) || null;
}
