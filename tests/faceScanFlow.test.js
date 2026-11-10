import test from 'node:test';
import assert from 'node:assert/strict';
import { nextFaceScanStage, lowQualityMessage } from '../src/services/faceScanFlow.js';

test('สแกนภาพหยาบแล้ววิเคราะห์ขั้นสูงโดยอัตโนมัติก่อนเผยแฟ้ม', () => {
  assert.equal(nextFaceScanStage('idle', 'start'), 'scanning');
  assert.equal(nextFaceScanStage('scanning', 'finished'), 'low-quality');
  assert.equal(nextFaceScanStage('low-quality', 'finished'), 'analyzing');
  assert.equal(nextFaceScanStage('low-quality', 'analyze'), 'low-quality');
  assert.equal(nextFaceScanStage('analyzing', 'finished'), 'complete');
  assert.equal(nextFaceScanStage('scanning', 'analyze'), 'scanning');
});

test('อธิบายผลภาพคุณภาพต่ำให้สอดคล้องกับผู้ที่เริ่มสแกน', () => {
  assert.match(lowQualityMessage('manual'), /คุณสแกนเองไม่ได้/);
  assert.match(lowQualityMessage('manual'), /วิเคราะห์ขั้นสูง/);
  assert.match(lowQualityMessage('niki'), /วิเคราะห์ขั้นสูง/);
});
