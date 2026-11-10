import test from 'node:test';
import assert from 'node:assert/strict';
import { askCapriBrain } from '../src/services/capriBrain.js';

test('หลังส่งเบาะแสแล้ว NIKI ไม่แนะนำให้เริ่มสืบคดีใหม่', async () => {
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null };
  try {
    const reply = await askCapriBrain({ userMessage: 'สารวัตรภัทรไปแล้ว', gameState: 'CASE_CLOSED' });
    assert.match(reply, /สารวัตร.*ดูแลต่อ/);
    assert.doesNotMatch(reply, /Case_Files|สแกนหน้า/);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});
