import test from 'node:test';
import assert from 'node:assert/strict';
import { initialReportConversation, advanceReportConversation, canMatchReportTarget, isReportProfileEligible, canOfferVictimReply, getNikiConversationState, REPORT_VICTIM_REQUEST, REPORT_SUSPECT_REQUEST, REPORT_ADDRESS_REQUEST } from '../src/services/reportConversation.js';
import { caseFiles, cameraPerson, cardHolderProfile } from '../src/services/caseFiles.js';
import { callGreeting, getCallBriefing } from '../src/services/policeCall.js';

function finish(state) {
  const messages = [];
  while (state.pending.length) { messages.push(state.pending[0]); state = advanceReportConversation(state, 'tick'); }
  return { state, messages };
}

test('เหตุยิงมีภาพสองส่วนจากกล้องเดียวกัน และเริ่มจากหาชื่อผู้เสียชีวิต', () => {
  const photos = caseFiles.filter((file) => file.kind === 'cctv');
  assert.deepEqual(photos.map((file) => file.subject), ['suspect', 'victim']);
  assert.equal(photos[0].cameraId, photos[1].cameraId);
  assert.notEqual(photos[0].imageUrl, photos[1].imageUrl);
  assert.notEqual(cameraPerson.id, cardHolderProfile.id);
  assert.match(callGreeting.join(' '), /เจ้าหน้าที่/);
  assert.match(getCallBriefing('direct').join(' '), /ยิง/);
  assert.equal(getCallBriefing('direct').at(-1), 'ผมกำลังส่งภาพจากกล้องวงจรปิดไปให้ รบกวนคุณช่วยตรวจสอบให้ทีว่าเขาเป็นใคร');
  assert.doesNotMatch(getCallBriefing('direct').join(' '), /ช่วยหาชื่อผู้เสียชีวิตให้ผมก่อนนะ/);
});

test('แสดงตัวเลือกส่งชื่อผู้เสียชีวิตเฉพาะหลังสแกนและค้นพบแฟ้มที่ตรงกัน', () => {
  assert.equal(canOfferVictimReply('awaiting-victim', 'victim', 'complete', cardHolderProfile.id), true);
  assert.equal(canOfferVictimReply('awaiting-victim', 'victim', 'scanning', cardHolderProfile.id), false);
  assert.equal(canOfferVictimReply('awaiting-victim', 'suspect', 'complete', cardHolderProfile.id), false);
  assert.equal(canOfferVictimReply('awaiting-victim', 'victim', 'complete', cameraPerson.id), false);
  assert.equal(canOfferVictimReply('awaiting-suspect', 'victim', 'complete', cardHolderProfile.id), false);
});

test('ต้องส่งชื่อผู้เสียชีวิตก่อน จึงขอคนยิงและที่อยู่ตามลำดับ', () => {
  let state = initialReportConversation;
  assert.equal(advanceReportConversation(state, 'send-name'), state);
  state = advanceReportConversation(state, 'files-ready');
  assert.equal(state.stage, 'awaiting-victim');
  assert.equal(canMatchReportTarget(state.stage, 'name', 'name'), true);
  assert.equal(canMatchReportTarget(state.stage, 'address', 'address'), false);
  let step = finish(advanceReportConversation(state, 'send-name'));
  assert.equal(step.state.stage, 'awaiting-suspect');
  assert.ok(step.messages.includes(REPORT_SUSPECT_REQUEST));
  step = finish(advanceReportConversation(step.state, 'send-name'));
  assert.equal(step.state.stage, 'awaiting-address');
  assert.ok(step.messages.includes(REPORT_ADDRESS_REQUEST));
  step = finish(advanceReportConversation(step.state, 'send-address'));
  assert.equal(step.state.stage, 'complete');
  assert.equal(getNikiConversationState('ACTIVE', step.state.stage), 'CASE_CLOSED');
  assert.match(REPORT_VICTIM_REQUEST, /ผู้เสียชีวิต/);
});

test('ต้องเลือกคำร้องและสแกนบุคคลที่ตรงกับขั้นตอนก่อนส่ง', () => {
  assert.equal(canMatchReportTarget('awaiting-victim', null, 'name'), false);
  assert.equal(canMatchReportTarget('awaiting-suspect', 'name', 'name'), true);
  assert.equal(canMatchReportTarget('awaiting-address', 'name', 'address'), false);
  assert.equal(isReportProfileEligible(cameraPerson.id, cardHolderProfile.id, 'complete'), false);
  assert.equal(isReportProfileEligible(cardHolderProfile.id, cardHolderProfile.id, 'scanning'), false);
  assert.equal(isReportProfileEligible(cardHolderProfile.id, cardHolderProfile.id, 'complete'), true);
});
