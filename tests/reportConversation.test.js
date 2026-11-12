import test from 'node:test';
import assert from 'node:assert/strict';
import { initialReportConversation, advanceReportConversation } from '../src/services/reportConversation.js';
import { POLICE_PREFIX } from '../src/services/policeConversation.js';
import * as reportConversation from '../src/services/reportConversation.js';

test('หลังสายสืบออกจากการสนทนา NIKI รู้ว่าส่งเบาะแสแล้ว', () => {
  assert.equal(reportConversation.getNikiConversationState('ACTIVE', 'address-reply'), 'ACTIVE');
  assert.equal(reportConversation.getNikiConversationState('ACTIVE', 'complete'), 'CASE_CLOSED');
  assert.equal(reportConversation.getNikiConversationState('IDLE', 'idle'), 'IDLE');
});

test('ต้องเลือกคำร้องที่ตรงกับข้อมูลและลำดับของบทสนทนาก่อนส่ง', () => {
  assert.equal(reportConversation.canMatchReportTarget('awaiting-victim', null, 'name'), false);
  assert.equal(reportConversation.canMatchReportTarget('awaiting-victim', 'name', 'address'), false);
  assert.equal(reportConversation.canMatchReportTarget('awaiting-victim', 'name', 'name'), true);
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

test('บทสนทนาให้ส่งชื่อผู้เสียชีวิต คนในภาพ และที่อยู่ตามลำดับก่อนจบสาย', () => {
  let state = advanceReportConversation(initialReportConversation, 'files-ready');
  assert.equal(state.stage, 'awaiting-victim');
  assert.equal(advanceReportConversation(state, 'send-address'), state);
  let step = finishMessages(advanceReportConversation(state, 'send-name'));
  assert.equal(step.state.stage, 'awaiting-suspect');
  assert.ok(step.messages.includes(reportConversation.REPORT_SUSPECT_REQUEST));
  step = finishMessages(advanceReportConversation(step.state, 'send-name'));
  assert.equal(step.state.stage, 'awaiting-address');
  assert.ok(step.messages.includes(reportConversation.REPORT_ADDRESS_REQUEST));
  step = finishMessages(advanceReportConversation(step.state, 'send-address'));
  assert.deepEqual(step.messages, [`${POLICE_PREFIX} ขอบคุณมาก`, `${POLICE_PREFIX} ไว้ได้เรื่องยังไงผมจะติดต่อกลับมาใหม่`, '[สายสืบภัทรวัฒน์ อนันต์กุลได้ออกจากการสนทนา]']);
  assert.equal(step.state.stage, 'complete');
});
