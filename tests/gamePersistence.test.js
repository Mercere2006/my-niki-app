import test from 'node:test';
import assert from 'node:assert/strict';
import { readGameValue, writeGameValue, scheduleAtDeadline } from '../src/services/gamePersistence.js';

test('สถานะเกมบันทึกและอ่านกลับได้ โดยค่าเสียหายหรือพื้นที่จัดเก็บใช้ไม่ได้ไม่ทำให้เกมพัง', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  assert.equal(writeGameValue('state', { stage: 'active' }, storage), true);
  assert.deepEqual(readGameValue('state', { stage: 'idle' }, storage), { stage: 'active' });
  values.set('niki_game_v1:state', '{bad json');
  assert.deepEqual(readGameValue('state', { stage: 'idle' }, storage), { stage: 'idle' });
  values.set('niki_game_v1:state', JSON.stringify('wrong type'));
  assert.deepEqual(readGameValue('state', { stage: 'idle' }, storage), { stage: 'idle' });
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(readGameValue('muted', false, blocked), false);
  assert.equal(writeGameValue('muted', true, blocked), false);
});

test('บทสนทนาเดิมที่บันทึกไว้เปลี่ยนชื่อสายสืบโดยยังรักษาคิวข้อความ', () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  writeGameValue('reportConversation', { stage: 'victim-reply', pending: ['[10.200.4.1] สารวัตรภัทรวัฒน์ อนันต์กุล: ขอบคุณ'] }, storage);
  const restored = readGameValue('reportConversation', { stage: 'idle', pending: [] }, storage);
  assert.equal(restored.stage, 'victim-reply');
  assert.deepEqual(restored.pending, ['[10.200.4.1] สายสืบภัทรวัฒน์ อนันต์กุล: ขอบคุณ']);
  writeGameValue('callQueue', [{ text: 'สารวัตรภัทรกำลังพิมพ์', raw: '[10.200.4.1] สารวัตรภัทรวัฒน์ อนันต์กุล: ขอบคุณ', after: 'report' }], storage);
  assert.deepEqual(readGameValue('callQueue', [], storage), [{ text: 'สายสืบภัทรวัฒน์กำลังพิมพ์', raw: '[10.200.4.1] สายสืบภัทรวัฒน์ อนันต์กุล: ขอบคุณ', after: 'report' }]);
  writeGameValue('chatLogs', [{ sender: 'SHOOM', text: 'รับสายสารวัตรภัทรวัฒน์ อนันต์กุล' }], storage);
  assert.equal(readGameValue('chatLogs', [], storage)[0].text, 'รับสายจากสายสืบภัทรวัฒน์ อนันต์กุล');
  writeGameValue('callMessages', [{ speaker: 'officer', text: 'ผมกำลังส่งเอกสารให้ รบกวนคุณช่วยเปิดตรวจสอบ แล้วเราค่อย ๆ เรียงเหตุการณ์ไปด้วยกันนะครับ' }], storage);
  assert.equal(readGameValue('callMessages', [], storage)[0].text, 'ผมกำลังส่งเอกสารให้ รบกวนคุณช่วยตรวจสอบแล้วเรียงเหตุการณ์ให้ที');
});

test('สายเข้าทันทีเมื่อกลับจากแท็บเบื้องหลังหลังครบเวลา และไม่เรียกซ้ำ', () => {
  let now = 1000;
  let due = 0;
  let timer;
  const listeners = new Map();
  const target = { addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: (name) => listeners.delete(name) };
  const cancel = scheduleAtDeadline({ deadline: 11000, onDue: () => due++, now: () => now, setTimer: (callback) => { timer = callback; return 1; }, clearTimer: () => {}, visibilityTarget: target, windowTarget: target });
  now = 3000;
  listeners.get('visibilitychange')();
  assert.equal(due, 0);
  now = 12000;
  listeners.get('visibilitychange')();
  timer();
  listeners.get('focus')();
  assert.equal(due, 1);
  cancel();
  assert.equal(listeners.size, 0);
});

test('รีเฟรชหลังครบเวลาจะไม่เริ่มรอสิบวินาทีใหม่', () => {
  let delay;
  let callback;
  let called = 0;
  const cancel = scheduleAtDeadline({ deadline: 5000, onDue: () => called++, now: () => 15000, setTimer: (fn, ms) => { callback = fn; delay = ms; return 1; }, clearTimer: () => {}, visibilityTarget: null, windowTarget: null });
  assert.equal(delay, 0);
  callback();
  assert.equal(called, 1);
  cancel();
});

test('ยกเลิกตัวจับเวลาแล้วไม่โทร แม้แท็บกลับมาเปิดหรือ timer เก่าทำงาน', () => {
  let callback;
  let called = 0;
  const listeners = new Map();
  const target = { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
  const cancel = scheduleAtDeadline({ deadline: 100, onDue: () => called++, now: () => 200, setTimer: (fn) => { callback = fn; return 1; }, clearTimer: () => {}, visibilityTarget: target, windowTarget: target });
  const onFocus = listeners.get('focus');
  cancel();
  callback();
  onFocus();
  assert.equal(called, 0);
  assert.equal(listeners.size, 0);
});
