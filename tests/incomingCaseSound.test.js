import test from 'node:test';
import assert from 'node:assert/strict';
import { playIncomingCaseSound } from '../src/services/incomingCaseSound.js';

test('plays the alert once, then Capri voice after it ends', async () => {
  const calls = [];
  const audio = { play() { calls.push('alert'); return Promise.resolve(); }, pause() { calls.push('pause'); } };
  playIncomingCaseSound({ createAudio: () => audio, playVoice: () => calls.push('voice') });
  assert.deepEqual(calls, ['alert']);
  audio.onended();
  assert.deepEqual(calls, ['alert', 'voice']);
});

test('mute prevents both sounds and cancellation stops the pending voice', () => {
  const calls = [];
  const audio = { play() { calls.push('alert'); return Promise.resolve(); }, pause() { calls.push('pause'); } };
  playIncomingCaseSound({ muted: true, createAudio: () => audio, playVoice: () => calls.push('voice') });
  assert.deepEqual(calls, []);
  const cancel = playIncomingCaseSound({ createAudio: () => audio, playVoice: () => calls.push('voice') });
  const finish = audio.onended;
  cancel();
  finish();
  assert.deepEqual(calls, ['alert', 'pause']);
});

test('tries Capri voice if the alert cannot play', async () => {
  let voices = 0;
  const audio = { play: () => Promise.reject(new Error('blocked')), pause() {} };
  playIncomingCaseSound({ createAudio: () => audio, playVoice: () => voices++ });
  await Promise.resolve();
  assert.equal(voices, 1);
});
