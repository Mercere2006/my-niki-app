import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretEvidenceOffer, getManualEvidence, getManualEvidenceResult } from '../src/services/evidenceInteraction.js';
import { followupFiles, followupQuestions } from '../src/services/caseFollowup.js';

test('เข้าใจคำตอบรับและปฏิเสธ ทั้งไทยและอังกฤษ โดยให้คำปฏิเสธมาก่อน', () => {
  for (const text of ['ให้ช่วย', 'เอาสิ', 'ได้', 'ได้ดิ', 'เค', 'เอาเลย', 'ช่วยวิเคราะห์หน่อย', 'yes', 'sure']) assert.equal(interpretEvidenceOffer(text), 'accept', text);
  for (const text of ['ไม่', 'ไม่อ่ะ', 'ไม่เอา', 'ไม่เป็นไร', 'ไม่ต้อง', 'nope', 'no', "don't", 'dont', 'ไม่ได้สิ ฉันต้องหาเอง', 'ไม่ล่ะ', 'เดี๋ยวหาเอง']) assert.equal(interpretEvidenceOffer(text), 'decline', text);
  for (const text of ['สวัสดี', 'ไม่รู้', 'รอสักครู่']) assert.equal(interpretEvidenceOffer(text), 'other', text);
});

test('หลักฐานที่เลือกได้ต้องมีอยู่ในไฟล์จริง และต้องเลือกครบก่อนสร้างคำตอบ', () => {
  for (const question of followupQuestions) {
    const snippets = getManualEvidence(question.id);
    assert.ok(snippets.length > 0);
    for (const item of snippets) {
      const file = followupFiles.find((entry) => entry.name === item.file);
      assert.ok(file?.content.includes(item.quote), item.id);
      assert.ok(question.requiredFiles.includes(item.file), item.id);
    }
    assert.equal(getManualEvidenceResult(question.id, []).complete, false);
    const result = getManualEvidenceResult(question.id, snippets.map((item) => item.id));
    assert.equal(result.complete, true);
    assert.ok(result.answer);
  }
  assert.equal(getManualEvidenceResult('unknown', []).complete, false);
});

test('ผลเปรียบเทียบและลำดับเหตุการณ์แยกคำให้การจากบันทึกและไม่สรุปว่าใครใช้บัตร', () => {
  for (const id of ['compare', 'timeline']) {
    const snippets = getManualEvidence(id);
    const result = getManualEvidenceResult(id, snippets.map((item) => item.id));
    assert.match(result.answer, /คำให้การ/);
    assert.match(result.answer, /22:11/);
    assert.doesNotMatch(result.answer, /กฤตภาสเป็นผู้ใช้บัตร|กฤตภาสเป็นคนยิง/);
  }
  const timeline = getManualEvidenceResult('timeline', getManualEvidence('timeline').map((item) => item.id));
  assert.ok(timeline.answer.indexOf('21:54') < timeline.answer.indexOf('22:11'));
  assert.ok(timeline.answer.indexOf('22:11') < timeline.answer.indexOf('22:14'));
  assert.match(timeline.answer, /22:25 น\. เจ้าหน้าที่รักษาความปลอดภัยพบผู้บาดเจ็บ/);
});
