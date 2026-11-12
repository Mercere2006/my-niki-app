import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as afterTick } from 'node:timers/promises';
import { playIncomingCaseSound } from '../src/services/incomingCaseSound.js';

test('เสียงเรียกเข้าดังวนและหยุดเมื่อยกเลิกสาย', async () => {
  const calls = [];
  const audio = { play() { calls.push('play'); return Promise.resolve(); }, pause() { calls.push('pause'); } };
  const stop = playIncomingCaseSound({ createAudio: () => audio });
  assert.equal(audio.loop, true);
  assert.deepEqual(calls, ['play']);
  stop();
  assert.deepEqual(calls, ['play', 'pause']);
});

test('ปิดเสียงแล้วไม่สร้างเสียงเรียกเข้า', () => {
  let created = false;
  playIncomingCaseSound({ muted: true, createAudio: () => { created = true; } });
  assert.equal(created, false);
});

test('หากเบราว์เซอร์บล็อกเสียง ให้ลองอีกครั้งเมื่อผู้เล่นกด และยกเลิกได้', async () => {
  const handlers = new Map();
  const target = { addEventListener(type, fn) { handlers.set(type, fn); }, removeEventListener(type) { handlers.delete(type); } };
  let calls = 0;
  const audio = { play() { calls++; return calls === 1 ? Promise.reject(new Error('blocked')) : Promise.resolve(); }, pause() {} };
  const stop = playIncomingCaseSound({ createAudio: () => audio, gestureTarget: target });
  await afterTick();
  assert.equal(calls, 1);
  assert.equal(typeof handlers.get('pointerdown'), 'function');
  handlers.get('pointerdown')();
  await afterTick();
  assert.equal(calls, 2);
  assert.equal(handlers.size, 0);
  stop();
});

test('หากวางสายก่อนปลดล็อกเสียง จะไม่ลองเล่นอีก', async () => {
  const handlers = new Map();
  const target = { addEventListener(type, fn) { handlers.set(type, fn); }, removeEventListener(type) { handlers.delete(type); } };
  let calls = 0;
  const audio = { play() { calls++; return Promise.reject(new Error('blocked')); }, pause() {} };
  const stop = playIncomingCaseSound({ createAudio: () => audio, gestureTarget: target });
  const retry = handlers.get('pointerdown');
  stop();
  await afterTick();
  retry();
  assert.equal(calls, 1);
  assert.equal(handlers.size, 0);
});
