import test from 'node:test';
import assert from 'node:assert/strict';
import { initialAttachment, advanceAttachment } from '../src/services/callAttachment.js';
import { inspectSimulatedDocuments } from '../src/services/caseFollowup.js';

test('ไฟล์ต้องอัปโหลดครบและตรวจสำเร็จก่อนเปิด', () => {
  let state = advanceAttachment(initialAttachment, 'upload');
  assert.equal(state.stage, 'uploading');
  assert.deepEqual(advanceAttachment(state, 'open'), state);
  state = advanceAttachment(state, 'uploaded');
  state = advanceAttachment(state, 'open');
  assert.equal(state.stage, 'checking');
  state = advanceAttachment(state, 'loaded');
  assert.equal(state.stage, 'scanning');
  state = advanceAttachment(state, 'scan-clean');
  assert.equal(state.stage, 'complete');
  assert.equal(state.wasInfected, false);
});

test('ไฟล์ติดไวรัสจำลองต้องล้างก่อน และโหลดผิดพลาดลองใหม่ได้', () => {
  let state = { stage: 'scanning', wasInfected: false };
  state = advanceAttachment(state, 'scan-infected');
  assert.equal(state.stage, 'cleaning');
  assert.deepEqual(advanceAttachment(state, 'open'), state);
  state = advanceAttachment(state, 'cleaned');
  assert.equal(state.stage, 'complete');
  assert.equal(state.wasInfected, true);
  state = advanceAttachment({ stage: 'checking', wasInfected: false }, 'load-failed');
  assert.equal(state.stage, 'error');
  assert.equal(advanceAttachment(state, 'open').stage, 'checking');
});

test('ตรวจชุดเอกสารจำลองก่อนปล่อยโฟลเดอร์ และพบภัยจำลองในไฟล์ใดก็ได้', () => {
  assert.deepEqual(inspectSimulatedDocuments([{ name: 'a.txt', content: 'ข้อมูล' }]), { ok: true, hasThreat: false });
  assert.deepEqual(inspectSimulatedDocuments([{ name: 'a.txt', content: 'ข้อมูล' }, { name: 'b.txt', content: 'ข้อมูล', simulatedThreat: true }]), { ok: true, hasThreat: true });
  assert.equal(inspectSimulatedDocuments([]).ok, false);
  assert.equal(inspectSimulatedDocuments([{ name: 'a.txt', content: '' }]).ok, false);
});
