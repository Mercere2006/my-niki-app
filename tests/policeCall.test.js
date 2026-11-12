import test from 'node:test';
import assert from 'node:assert/strict';
import { callGreeting, callChoices, getCallBriefing, callbackGreeting, callbackChoice, missedCallbackGreeting, missedCallbackChoice, getCallbackContinuation, getRingDeadline, isRingExpired, RING_TIMEOUT_MS, isOfficerOffline, splitCallText, stripPolicePrefix } from '../src/services/policeCall.js';

test('สายโทรกล่าวกับเจ้าหน้าที่ และส่งภาพก่อนเอกสารโดยไม่เปิดเผยตัวตนแฮกเกอร์', () => {
  assert.match(callGreeting.join(' '), /เจ้าหน้าที่/);
  assert.match(callGreeting.join(' '), /ภัทรวัฒน์ อนันต์กุล/);
  assert.equal(callChoices.length, 2);
  for (const choice of callChoices) {
    const text = getCallBriefing(choice.id).join(' ');
    assert.match(text, /กล้องวงจรปิด/);
    assert.match(text, /ส่งภาพ/);
    assert.doesNotMatch(text, /แฮ็กเกอร์|Hacker|อัปโหลด.*เอกสาร|ดาวน์โหลด/);
  }
});

test('เอฟเฟกต์พิมพ์รักษาวรรณยุกต์ไทยและข้อความต้นฉบับ', () => {
  const original = 'สวัสดีครับ เจ้าหน้าที่';
  const letters = splitCallText(original);
  assert.equal(letters.join(''), original);
  assert.ok(letters.includes('วั'));
  assert.equal(stripPolicePrefix('[10.200.4.1] สายสืบภัทรวัฒน์ อนันต์กุล: พบว่าเป็นใครครับ'), 'พบว่าเป็นใครครับ');
});

test('วางสายเองยังออนไลน์ และโทรกลับมีบทขอโทษก่อนเล่าคดีต่อ', () => {
  assert.equal(isOfficerOffline('idle', false, 'declined'), false);
  assert.equal(isOfficerOffline('complete', true, 'declined'), false);
  assert.equal(isOfficerOffline('complete', false, 'briefed'), true);
  assert.equal(callbackGreeting, 'โถ่คุณเจ้าหน้าที่สายด่วน วางสายผมทำไมเนี่ย');
  assert.equal(callbackChoice, 'ขอโทษทีครับ พอดีผมกดผิด');
  for (const followup of [false, true]) {
    const lines = getCallbackContinuation(followup);
    assert.deepEqual(lines.slice(0, 2), ['งั้นเหรอครับ', 'เพื่อไม่ให้เป็นการเสียเวลา เรามาเข้าเรื่องกันเลยดีกว่า']);
    assert.match(lines.slice(2).join(' '), followup ? /เอกสาร/ : /กล้องวงจรปิด/);
  }
});

test('สายที่ไม่ได้รับหมดเวลาหลัง 30 วินาที แม้กลับเข้ามาภายหลัง', () => {
  assert.equal(RING_TIMEOUT_MS, 30000);
  const deadline = getRingDeadline(1000);
  assert.equal(deadline, 31000);
  assert.equal(isRingExpired(deadline, 30999), false);
  assert.equal(isRingExpired(deadline, 31000), true);
  assert.equal(isRingExpired(deadline, 60000), true);
  assert.equal(isRingExpired(null, 60000), false);
});

test('โทรกลับหลังไม่ได้รับสายมีบทเฉพาะ และกลับไปยังคดีที่ตรงกับสาย', () => {
  assert.equal(missedCallbackGreeting, 'คุณเจ้าหน้าที่สายด่วน ทำไมก่อนหน้านี้ไม่รับสายผมล่ะ');
  assert.equal(missedCallbackChoice, 'ขอโทษทีครับ พอดีผมเพิ่งว่าง');
  for (const followup of [false, true]) {
    const lines = getCallbackContinuation(followup, 'missed');
    assert.deepEqual(lines.slice(0, 3), ['อ่าวเหรอครับ', 'แต่ตอนนี้คุณว่างแล้วใช่ไหม', 'งั้นผมขอเข้าเรื่องเลยนะ']);
    assert.match(lines.slice(3).join(' '), followup ? /เอกสาร/ : /กล้องวงจรปิด/);
  }
  assert.equal(isOfficerOffline('idle', false, 'declined'), false);
});
