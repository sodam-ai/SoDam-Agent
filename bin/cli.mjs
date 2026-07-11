#!/usr/bin/env node
// AgentRoster 진입점. 인자가 없으면 대화형 메뉴, 있으면 해당 명령 실행.
import { main } from '../src/main.mjs';
import { closeUI } from '../src/ui.mjs';

main(process.argv.slice(2))
  .catch((err) => {
    console.error('\n❌ 예상치 못한 오류가 발생했습니다:', err?.message || err);
    console.error('   (안전을 위해 작업을 중단했습니다. 같은 문제가 반복되면 화면을 그대로 복사해 알려주세요.)');
    process.exit(1);
  })
  .finally(() => closeUI());
