import test from 'node:test';
import assert from 'node:assert/strict';
import { guidedEvidenceQuestions, getMissingGuidedFiles, initialGuidedSequence, advanceGuidedSequence } from '../src/services/guidedEvidence.js';
import { caseFiles } from '../src/services/caseFiles.js';

test('สายสืบตั้งคำถามเจาะจงและอ้างอิงไฟล์คดีที่มีอยู่', () => {
  assert.equal(guidedEvidenceQuestions.length, 3);
  assert.match(guidedEvidenceQuestions[0].question, /บัตร/);
  assert.match(guidedEvidenceQuestions[1].question, /คำให้การ/);
  assert.equal(guidedEvidenceQuestions[2].mode, 'timeline');
  for (const question of guidedEvidenceQuestions) {
    assert.ok(question.line.includes(question.question));
    for (const name of question.requiredFiles) assert.ok(caseFiles.some((file) => file.name === name && file.content));
  }
});

test('สายสืบรอให้ผู้เล่นส่งผลวิเคราะห์ทุกข้อก่อนถามต่อหรือจบ', () => {
  let state = initialGuidedSequence;
  assert.deepEqual(state, { index: -1, phase: 'pending' });
  state = advanceGuidedSequence(state, 'delivered');
  assert.deepEqual(state, { index: 0, phase: 'pending' });
  state = advanceGuidedSequence(state, 'delivered');
  assert.deepEqual(state, { index: 0, phase: 'ready' });
  assert.deepEqual(advanceGuidedSequence(state, 'continue'), state);
  assert.deepEqual(advanceGuidedSequence(state, 'failed'), state);
  state = advanceGuidedSequence(state, 'success');
  assert.deepEqual(state, { index: 0, phase: 'review' });
  assert.deepEqual(advanceGuidedSequence(state, 'delivered'), state);
  state = advanceGuidedSequence(state, 'continue');
  assert.deepEqual(state, { index: 1, phase: 'pending' });
  state = advanceGuidedSequence(state, 'delivered');
  state = advanceGuidedSequence(state, 'success');
  state = advanceGuidedSequence(state, 'continue');
  assert.deepEqual(state, { index: 2, phase: 'pending' });
  state = advanceGuidedSequence(state, 'delivered');
  state = advanceGuidedSequence(state, 'success');
  assert.deepEqual(state, { index: 2, phase: 'review' });
  state = advanceGuidedSequence(state, 'continue');
  assert.deepEqual(state, { index: 2, phase: 'complete' });
});

test('แต่ละคำถามต้องเปิดไฟล์ที่เกี่ยวข้องก่อน ไม่ส่งหลักฐานที่ยังไม่เปิด', () => {
  const [first, second] = guidedEvidenceQuestions;
  assert.deepEqual(getMissingGuidedFiles(first, []), ['access_log.txt']);
  assert.deepEqual(getMissingGuidedFiles(first, ['access_log.txt']), []);
  assert.deepEqual(getMissingGuidedFiles(second, ['access_log.txt']), ['witness_statement.txt']);
  assert.deepEqual(getMissingGuidedFiles(second, ['access_log.txt', 'witness_statement.txt']), []);
  assert.deepEqual(getMissingGuidedFiles(guidedEvidenceQuestions[2], ['access_log.txt', 'witness_statement.txt']), ['incident_report.txt']);
});
