import { POLICE_PREFIX } from './policeConversation.js';

export const initialReportConversation = { stage: 'idle', pending: [] };
export const REPORT_NAME_REQUEST = `${POLICE_PREFIX} ได้เรื่องบ้างไหม`;
export const REPORT_ADDRESS_REQUEST = `${POLICE_PREFIX} ว่าแต่คุณมีที่อยู่ของเขาไหม`;

export function getNikiConversationState(gameState, reportStage) {
  return gameState === 'ACTIVE' && reportStage === 'complete' ? 'CASE_CLOSED' : gameState;
}

export function canMatchReportTarget(stage, selected, target) {
  return selected === target && ((stage === 'awaiting-name' && target === 'name') || (stage === 'awaiting-address' && target === 'address'));
}

export function isReportProfileEligible(personId, cameraPersonId, scanStage) {
  return scanStage === 'complete' && personId === cameraPersonId;
}

export function advanceReportConversation(state, event) {
  if (state.stage === 'idle' && event === 'profile-found') return {
    stage: 'greeting', pending: [`${POLICE_PREFIX} ไงคุณแฮ็กเกอร์`, REPORT_NAME_REQUEST],
  };
  if (state.stage === 'awaiting-name' && event === 'send-name') return {
    stage: 'name-reply', pending: [`${POLICE_PREFIX} โอ้ ขอบคุณมากคุณแฮ็กเกอร์`, REPORT_ADDRESS_REQUEST],
  };
  if (state.stage === 'awaiting-address' && event === 'send-address') return {
    stage: 'address-reply', pending: [`${POLICE_PREFIX} ขอบคุณมาก`, `${POLICE_PREFIX} ไว้ได้เรื่องยังไงผมจะติดต่อกลับมาใหม่`, '[สารวัตรภัทรได้ออกจากการสนทนา]'],
  };
  if (event === 'tick' && state.pending.length) {
    const pending = state.pending.slice(1);
    const nextStage = { greeting: 'awaiting-name', 'name-reply': 'awaiting-address', 'address-reply': 'complete' }[state.stage];
    return { stage: pending.length ? state.stage : nextStage, pending };
  }
  return state;
}
