import test from 'node:test';
import assert from 'node:assert/strict';
import { isGuidanceRequest, getNextStepGuidance } from '../src/services/nikiGuidance.js';

test('เข้าใจคำถามขอวิธีเล่นต่อและไม่สับสนกับคำตอบรับหรือปฏิเสธ', () => {
  for (const text of ['ทำอะไรยังต่อ', 'ทำอะไรต่อ', 'ทำยังไงต่อดี', 'ต่อไปต้องทำอะไร', 'ไปต่อยังไง', 'ทำไงดี', 'ทำไงดี'.normalize('NFKC'), 'ต้องทำไรต่อ', 'ไปไหนต่อ', 'ช่วยไกด์หน่อย', 'what should I do next?']) assert.equal(isGuidanceRequest(text), true, text);
  for (const text of ['เอาสิ', 'ได้ดิ', 'ไม่ต้อง เดี๋ยวหาเอง', 'ช่วยหน่อย', 'สวัสดี']) assert.equal(isGuidanceRequest(text), false, text);
});

test('ไกด์รับสาย รับไฟล์ และการสแกนโดยไม่เฉลยก่อนเวลา', () => {
  assert.match(getNextStepGuidance({ hasIncomingCase: true }), /รับสาย/);
  assert.match(getNextStepGuidance({ policeConversation: 'declined' }), /โทรกลับ/);
  assert.match(getNextStepGuidance({ policeConversation: 'declined', followupPhase: 'ringing' }), /โทรกลับ/);
  assert.match(getNextStepGuidance({ policeConversation: 'declined', callEndReason: 'missed' }), /ไม่ได้รับสาย.*โทรกลับ/);
  assert.match(getNextStepGuidance({ policeConversation: 'briefed', attachmentStage: 'ready', reportStage: 'idle' }), /Case_Files/);
  const beforeScan = getNextStepGuidance({ attachmentStage: 'complete', reportStage: 'awaiting-victim', scanStage: 'idle', caseFilesLocation: 'desktop' });
  assert.match(beforeScan, /ภาพผู้เสียชีวิต/);
  assert.doesNotMatch(beforeScan, /ธันวา|กฤตภาส|อัศวกร/);
  const scanned = getNextStepGuidance({ attachmentStage: 'complete', reportStage: 'awaiting-victim', scanStage: 'complete', scanSubject: 'victim', caseFilesLocation: 'desktop', knownPersonName: 'ธันวา วรากร' });
  assert.match(scanned, /HumanDB/);
  assert.match(scanned, /ธันวา วรากร/);
});

test('ไกด์คำถามเอกสารตามทางเลือกผู้เล่นและสถานะโฟลเดอร์', () => {
  const base = { followupPhase: 'active', documentsStage: 'complete', guidedPhase: 'ready', caseDocumentsLocation: 'desktop' };
  assert.match(getNextStepGuidance({ ...base, evidenceMode: 'idle' }), /กด.*คำถาม/);
  assert.match(getNextStepGuidance({ ...base, evidenceMode: 'offer' }), /กดกรอบคำถาม/);
  assert.match(getNextStepGuidance({ ...base, evidenceMode: 'manual' }), /กดกรอบคำถาม/);
  assert.match(getNextStepGuidance({ ...base, evidenceMode: 'assisting' }), /กำลังตรวจ/);
  assert.match(getNextStepGuidance({ ...base, guidedPhase: 'review' }), /ส่งคำตอบ/);
  assert.match(getNextStepGuidance({ ...base, guidedPhase: 'review', hasGuidedAnswerFile: true }), /เอกสารคำตอบ/);
  assert.match(getNextStepGuidance({ ...base, evidenceMode: 'manual', caseDocumentsLocation: 'trash' }), /กู้คืน/);
});

test('ไกด์หลักฐานใหม่และช่วงรอโดยไม่เปิดเผยคนร้ายก่อนสแกน', () => {
  const base = { followupPhase: 'active', documentsStage: 'complete', guidedPhase: 'complete' };
  assert.match(getNextStepGuidance({ ...base, endingStage: 'awaiting-upload', dashcamStage: 'ready' }), /Dashcam_Files/);
  const beforeScan = getNextStepGuidance({ ...base, endingStage: 'awaiting-face', dashcamStage: 'complete', dashcamLocation: 'desktop', scanStage: 'idle' });
  assert.match(beforeScan, /สแกน/);
  assert.doesNotMatch(beforeScan, /อัศวกร/);
  assert.match(getNextStepGuidance({ ...base, endingStage: 'awaiting-name' }), /ส่ง.*ชื่อ/);
  assert.match(getNextStepGuidance({ ...base, endingStage: 'complete' }), /คุย/);
});
