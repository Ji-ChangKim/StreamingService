import { kstDay, modeFor } from './debutAutomation/policy';
import { runDiscovery } from './debutAutomation/runner';

// 공개 실행 URL은 두지 않는다. 예약 실행 외부 호출로 조사 비용이 늘어나는 것을 차단한다.
export default {
  async scheduled(event:ScheduledController,env:DiscoveryEnv,ctx:ExecutionContext){
    let mode=modeFor(event.cron);
    // 최종 배포 시험은 당일 오전 배치를 한 번만 보충한다. 같은 날짜 슬롯은 재실행하지 않는다.
    if(!mode&&event.cron==='* * * * *'&&Date.now()<Date.parse(env.SMOKE_TEST_UNTIL))mode='DISCOVER';
    // 명시한 과거 범위의 보강 시험만 허용한다. 만료 시각과 월 8회 제한을 함께 적용한다.
    if(!mode&&event.cron==='* * * * *'&&Date.now()<Date.parse(env.BACKFILL_UNTIL))mode='BACKFILL';
    if(!mode)return;
    const slot=mode==='BACKFILL'?`backfill:${env.BACKFILL_FROM}:${env.BACKFILL_TO}:${new Date(event.scheduledTime).toISOString().slice(0,16)}`:mode==='SMOKE'?`smoke:${new Date(event.scheduledTime).toISOString().slice(0,16)}`:event.cron==='* * * * *'?`discovery-test:${kstDay(event.scheduledTime)}:${env.AUTOMATION_VERSION}`:`${kstDay(event.scheduledTime)}:${mode}`;
    ctx.waitUntil(runDiscovery(env,mode,event.scheduledTime,slot).then(result=>{if(!result)console.log(JSON.stringify({event:'debut-discovery-skipped',slot,reason:'LEASE_SLOT_MONTHLY_BUDGET_OR_DISABLED'}));}));
  },
} satisfies ExportedHandler<DiscoveryEnv>;
