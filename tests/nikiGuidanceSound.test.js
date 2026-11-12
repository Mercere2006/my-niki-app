import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as afterTick } from 'node:timers/promises';
import { playNikiGuidanceSound } from '../src/services/nikiGuidanceSound.js';

test('เสียงแนะนำเล่นหนึ่งครั้งและหยุดได้', async () => {
  const calls = [];
  const audio = { play() { calls.push('play'); return Promise.resolve(); }, pause() { calls.push('pause'); } };
  const stop = playNikiGuidanceSound({ createAudio: () => audio });
  assert.equal(audio.loop, false);
  assert.ok(audio.volume > 0 && audio.volume < 0.5);
  assert.deepEqual(calls, ['play']);
  stop();
  assert.deepEqual(calls, ['play', 'pause']);
});

test('ปิดเสียงแล้วไม่สร้างเสียง และเบราว์เซอร์บล็อกเสียงไม่ทำให้เกมพัง', async () => {
  let created = false;
  playNikiGuidanceSound({ muted: true, createAudio: () => { created = true; } });
  assert.equal(created, false);
  const stop = playNikiGuidanceSound({ createAudio: () => ({ play: () => Promise.reject(new Error('blocked')), pause() {} }) });
  await afterTick();
  assert.doesNotThrow(stop);
});
