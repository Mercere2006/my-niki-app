import test from 'node:test';
import assert from 'node:assert/strict';
import { moveWindow, resizeWindow } from '../src/services/windowSizing.js';

test('ย้ายหน้าต่างตามระยะลากและให้อยู่ภายในพื้นที่เดสก์ท็อป', () => {
  const rect = { left: 100, top: 80, width: 500, height: 350 };
  assert.deepEqual(moveWindow({ rect, deltaX: 80, deltaY: 40, viewportWidth: 1000, viewportHeight: 700 }), { left: 180, top: 120 });
  assert.deepEqual(moveWindow({ rect, deltaX: -500, deltaY: -500, viewportWidth: 1000, viewportHeight: 700 }), { left: 0, top: 32 });
  assert.deepEqual(moveWindow({ rect, deltaX: 1000, deltaY: 1000, viewportWidth: 1000, viewportHeight: 700 }), { left: 500, top: 306 });
});

test('ปรับขนาดหน้าต่างตามระยะลาก', () => {
  assert.deepEqual(resizeWindow({ width: 600, height: 450, deltaX: 100, deltaY: -50, maxWidth: 1000, maxHeight: 700 }), { width: 700, height: 400 });
});

test('จำกัดขนาดให้อยู่ในพื้นที่หน้าจอและไม่เล็กเกินไป', () => {
  assert.deepEqual(resizeWindow({ width: 600, height: 450, deltaX: -1000, deltaY: -1000, maxWidth: 1000, maxHeight: 700 }), { width: 320, height: 240 });
  assert.deepEqual(resizeWindow({ width: 600, height: 450, deltaX: 1000, deltaY: 1000, maxWidth: 750, maxHeight: 550 }), { width: 750, height: 550 });
  assert.deepEqual(resizeWindow({ width: 300, height: 200, deltaX: -100, deltaY: -100, maxWidth: 280, maxHeight: 180 }), { width: 280, height: 180 });
});
