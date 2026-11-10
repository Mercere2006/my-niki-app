import test from 'node:test';
import assert from 'node:assert/strict';
import { initialReportConversation, advanceReportConversation } from '../src/services/reportConversation.js';
import { POLICE_PREFIX } from '../src/services/policeConversation.js';
import * as reportConversation from '../src/services/reportConversation.js';

test('หลังสารวัตรออกจากการสนทนา NIKI รู้ว่าส่งเบาะแสแล้ว', () => {
  assert.equal(reportConversation.getNikiConversationState('ACTIVE', 'address-reply'), 'ACTIVE');
  assert.equal(reportConversation.getNikiConversationState('ACTIVE', 'complete'), 'CASE_CLOSED');
  assert.equal(reportConversation.getNikiConversationState('IDLE', 'idle'), 'IDLE');
});

test('ต้องเลือกคำร้องที่ตรงกับข้อมูลและลำดับของบทสนทนาก่อนส่ง', () => {
  assert.equal(reportConversation.canMatchReportTarget('awaiting-name', null, 'name'), false);
  assert.equal(reportConversation.canMatchReportTarget('awaiting-name', 'name', 'address'), false);
  assert.equal(reportConversation.canMatchReportTarget('awaiting-name', 'name', 'name'), true);
  assert.equal(reportConversation.canMatchReportTarget('awaiting-address', 'name', 'name'), false);
  assert.equal(reportConversation.canMatchReportTarget('awaiting-address', 'address', 'address'), true);
  assert.equal(reportConversation.canMatchReportTarget('complete', 'address', 'address'), false);
});

test('การรายงานเปิดเมื่อสแกนเสร็จและใช้แฟ้มคนในภาพเท่านั้น', () => {
  assert.equal(reportConversation.isReportProfileEligible('P-014', 'P-027', 'complete'), false);
  assert.equal(reportConversation.isReportProfileEligible('P-027', 'P-027', 'scanning'), false);
  assert.equal(reportConversation.isReportProfileEligible('P-027', 'P-027', 'complete'), true);
});

function finishMessages(state) {
  const messages = [];
  while (state.pending.length) {
    messages.push(state.pending[0]);
    state = advanceReportConversation(state, 'tick');
  }
  return { state, messages };
}

test('บทสนทนาให้ส่งชื่อก่อนที่อยู่ และสารวัตรออกจากการสนทนาเมื่อจบ', () => {
  let state = advanceReportConversation(initialReportConversation, 'profile-found');
  assert.equal(advanceReportConversation(state, 'send-name'), state);
  let step = finishMessages(state);
  assert.deepEqual(step.messages, [`${POLICE_PREFIX} ไงคุณแฮ็กเกอร์`, `${POLICE_PREFIX} ได้เรื่องบ้างไหม`]);
  state = step.state;
  assert.equal(state.stage, 'awaiting-name');
  assert.equal(advanceReportConversation(state, 'send-address'), state);
  step = finishMessages(advanceReportConversation(state, 'send-name'));
  assert.deepEqual(step.messages, [`${POLICE_PREFIX} โอ้ ขอบคุณมากคุณแฮ็กเกอร์`, `${POLICE_PREFIX} ว่าแต่คุณมีที่อยู่ของเขาไหม`]);
  assert.equal(step.state.stage, 'awaiting-address');
  step = finishMessages(advanceReportConversation(step.state, 'send-address'));
  assert.deepEqual(step.messages, [`${POLICE_PREFIX} ขอบคุณมาก`, `${POLICE_PREFIX} ไว้ได้เรื่องยังไงผมจะติดต่อกลับมาใหม่`, '[สารวัตรภัทรได้ออกจากการสนทนา]']);
  assert.equal(step.state.stage, 'complete');
  assert.equal(advanceReportConversation(step.state, 'profile-found'), step.state);
});
