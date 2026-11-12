import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as afterTick } from 'node:timers/promises';
import { createTypewriterSound } from '../src/services/typewriterSound.js';

test('เสียงคลิกเล่นเมื่อมีตัวอักษรใหม่และหยุดได้', () => {
  let plays = 0;
  let pauses = 0;
  const audio = { currentTime: 9, play() { plays++; return Promise.resolve(); }, pause() { pauses++; } };
  const sound = createTypewriterSound({ createAudio: () => audio });
  sound.play({ previousCount: 0, currentCount: 1 });
  assert.equal(plays, 1);
  assert.equal(audio.currentTime, 0);
  assert.ok(audio.volume > 0 && audio.volume < 0.5);
  sound.play({ previousCount: 1, currentCount: 1 });
  sound.play({ previousCount: 1, currentCount: 2, muted: true });
  sound.play({ previousCount: 1, currentCount: 2, visible: false });
  assert.equal(plays, 1);
  sound.play({ previousCount: 1, currentCount: 2 });
  assert.equal(plays, 2);
  sound.stop();
  assert.equal(pauses, 1);
});

test('เสียงถูกบล็อกหรือไม่มีอุปกรณ์เสียงไม่ขัดจังหวะเกม', async () => {
  const blocked = createTypewriterSound({ createAudio: () => ({ play: () => Promise.reject(new Error('blocked')), pause() {} }) });
  blocked.play({ previousCount: 0, currentCount: 1 });
  await afterTick();
  blocked.stop();
  const unavailable = createTypewriterSound({ createAudio: () => { throw new Error('unavailable'); } });
  assert.doesNotThrow(() => unavailable.play({ previousCount: 0, currentCount: 1 }));
});
