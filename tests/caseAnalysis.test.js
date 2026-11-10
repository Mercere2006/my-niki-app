import test from 'node:test';
import assert from 'node:assert/strict';
import { caseFiles } from '../src/services/caseFiles.js';
import { prepareFaceScan, compareFaceDescriptors, interpretAnalysisReply } from '../src/services/caseAnalysis.js';

test('แฟ้มคดีมีภาพกล้องสำหรับสแกน', () => {
  const cctv = caseFiles.filter((file) => file.kind === 'cctv');
  assert.equal(cctv.length, 1);
  assert.ok(cctv[0].imageUrl?.startsWith('/cases/'));
});

test('เตรียมสแกนจากแฟ้มคดี และปฏิเสธหลักฐานที่ไม่ครบ', () => {
  const result = prepareFaceScan(caseFiles);
  assert.equal(result.ok, true);
  assert.equal(result.cctv.imageUrl, caseFiles[0].imageUrl);
  assert.equal(prepareFaceScan([]).ok, false);
  assert.equal(prepareFaceScan([{ ...caseFiles[0], imageUrl: '' }]).ok, false);
});

test('เปรียบเทียบเวกเตอร์จากภาพและไม่รายงานว่าตรงเมื่อผลไม่ตรง', () => {
  assert.equal(compareFaceDescriptors([0, 0], [0.1, 0.1]).matched, true);
  assert.equal(compareFaceDescriptors([0, 0], [1, 1]).matched, false);
  assert.throws(() => compareFaceDescriptors([], []));
  assert.throws(() => compareFaceDescriptors([1], [1, 2]));
  assert.throws(() => compareFaceDescriptors([NaN], [1]));
});

test('เข้าใจคำตอบรับและปฏิเสธโดยไม่สแกนเมื่อผู้เล่นปฏิเสธ', () => {
  for (const text of ['เอาสิ', 'ช่วยวิเคราะห์หน่อย', 'ตกลง', 'ได้เลย', 'ช่วยสแกนหน้าหน่อย']) assert.equal(interpretAnalysisReply(text, true), 'accept');
  for (const text of ['ไม่เอา', 'ยังไม่ต้องสแกนหน้า', 'ไม่ใช่']) assert.equal(interpretAnalysisReply(text, true), 'decline');
  assert.equal(interpretAnalysisReply('สวัสดี', true), 'other');
  assert.equal(interpretAnalysisReply('เอาสิ', false), 'other');
});

test('เมื่อสารวัตรออกจากการสนทนา ข้อความคุยเล่นไม่เริ่มสแกนซ้ำ', () => {
  assert.equal(interpretAnalysisReply('เราสแกนเสร็จแล้วนะ', false, 'complete'), 'other');
  assert.equal(interpretAnalysisReply('ช่วยสแกนหน่อย', true, 'complete'), 'other');
  assert.equal(interpretAnalysisReply('ช่วยสแกนหน่อย', true, 'idle'), 'accept');
});
