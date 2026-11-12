import { POLICE_PREFIX } from './policeConversation.js';
import { cardHolderProfile } from './caseFiles.js';

export const initialReportConversation = { stage: 'idle', pending: [] };
export const REPORT_VICTIM_REQUEST = `${POLICE_PREFIX} ช่วยหาชื่อผู้เสียชีวิตให้ผมก่อนนะ`;
export const REPORT_SUSPECT_REQUEST = `${POLICE_PREFIX} แล้วคนที่ยิงล่ะ คุณพอจะตรวจสอบได้ไหม`;
export const REPORT_NAME_REQUEST = REPORT_SUSPECT_REQUEST;
export const REPORT_ADDRESS_REQUEST = `${POLICE_PREFIX} ว่าแต่คุณมีที่อยู่ของเขาไหม`;
export const REPORT_END_MESSAGE = '[สายสืบภัทรวัฒน์ อนันต์กุลได้ออกจากการสนทนา]';

export function isCallDepartureMessage(entry) {
  return entry?.speaker === 'system' && ((entry.after === 'report' && entry.raw === REPORT_END_MESSAGE) || (entry.after === 'ending' && entry.text === REPORT_END_MESSAGE));
}

export function getNikiConversationState(gameState, reportStage) {
  return gameState === 'ACTIVE' && reportStage === 'complete' ? 'CASE_CLOSED' : gameState;
}

export function canMatchReportTarget(stage, selected, target) {
  return selected === target && ((['awaiting-victim', 'awaiting-suspect'].includes(stage) && target === 'name') || (stage === 'awaiting-address' && target === 'address'));
}

export function isReportProfileEligible(personId, cameraPersonId, scanStage) {
  return scanStage === 'complete' && personId === cameraPersonId;
}

export function canOfferVictimReply(reportStage, scanSubject, scanStage, personId) {
  return reportStage === 'awaiting-victim' && scanSubject === 'victim' && scanStage === 'complete' && personId === cardHolderProfile.id;
}

export function advanceReportConversation(state, event) {
  if (state.stage === 'idle' && event === 'files-ready') return { stage: 'awaiting-victim', pending: [] };
  if (state.stage === 'awaiting-victim' && event === 'send-name') return {
    stage: 'victim-reply', pending: [`${POLICE_PREFIX} ขอบคุณครับ ผมจะตรวจสอบข้อมูลของผู้เสียชีวิตต่อ`, REPORT_SUSPECT_REQUEST],
  };
  if (state.stage === 'awaiting-suspect' && event === 'send-name') return {
    stage: 'name-reply', pending: [`${POLICE_PREFIX} ขอบคุณครับ ผมจะนำชื่อนี้ไปตรวจสอบต่อ`, REPORT_ADDRESS_REQUEST],
  };
  if (state.stage === 'awaiting-address' && event === 'send-address') return {
    stage: 'address-reply', pending: [`${POLICE_PREFIX} ขอบคุณมาก`, `${POLICE_PREFIX} ไว้ได้เรื่องยังไงผมจะติดต่อกลับมาใหม่`, REPORT_END_MESSAGE],
  };
  if (event === 'tick' && state.pending.length) {
    const pending = state.pending.slice(1);
    const nextStage = { 'victim-reply': 'awaiting-suspect', 'name-reply': 'awaiting-address', 'address-reply': 'complete' }[state.stage];
    return { stage: pending.length ? state.stage : nextStage, pending };
  }
  return state;
}
