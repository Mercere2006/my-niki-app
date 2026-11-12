import test from 'node:test';
import assert from 'node:assert/strict';
import { caseFiles } from '../src/services/caseFiles.js';
import { getOpenedEvidence, parseEvidenceResponse, parseEvidenceResult } from '../src/services/evidenceAnalysis.js';
import { askEvidenceBrain, askEvidenceBrainResult } from '../src/services/capriBrain.js';

test('ส่งให้วิเคราะห์เฉพาะเอกสารที่ผู้เล่นเปิดแล้ว', () => {
  const docs = caseFiles.filter((file) => file.kind === 'document');
  assert.equal(docs.length, 3);
  assert.deepEqual(getOpenedEvidence(caseFiles, [docs[0].name, 'cam_02_2214.png']).map((file) => file.name), [docs[0].name]);
  assert.deepEqual(getOpenedEvidence(caseFiles, []), []);
});

test('คำตอบต้องอ้างข้อความจริงจากไฟล์ที่เปิดแล้ว', () => {
  const files = [{ name: 'log.txt', content: 'เวลา 22:11 ใช้บัตรเข้าอาคาร' }];
  const valid = JSON.stringify({ answer: 'มีการใช้บัตรเวลา 22:11', citations: [{ file: 'log.txt', quote: 'เวลา 22:11 ใช้บัตรเข้าอาคาร' }] });
  assert.match(parseEvidenceResponse(valid, files), /log\.txt.*เวลา 22:11/s);
  const fabricated = JSON.stringify({ answer: 'พบคนร้าย', citations: [{ file: 'log.txt', quote: 'พบคนร้าย' }] });
  assert.match(parseEvidenceResponse(fabricated, files), /ตรวจสอบแหล่งอ้างอิงไม่ได้/);
  const unread = JSON.stringify({ answer: 'พบคนร้าย', citations: [{ file: 'hidden.txt', quote: 'เวลา 22:11 ใช้บัตรเข้าอาคาร' }] });
  assert.match(parseEvidenceResponse(unread, files), /ตรวจสอบแหล่งอ้างอิงไม่ได้/);
  assert.match(parseEvidenceResponse('{bad json', files), /ตรวจสอบแหล่งอ้างอิงไม่ได้/);
  assert.equal(parseEvidenceResult(valid, files).ok, true);
  assert.equal(parseEvidenceResult(valid, files).answer, 'มีการใช้บัตรเวลา 22:11');
  assert.equal(parseEvidenceResult(fabricated, files).ok, false);
  assert.equal(parseEvidenceResult(JSON.stringify({ answer: 'ไม่ทราบ', citations: [] }), files).ok, false);
});

test('ไม่มี API key หรือไม่มีเอกสารที่เปิดแล้วต้องแจ้งผู้เล่นตามจริง', async () => {
  const oldStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null };
  try {
    assert.match(await askEvidenceBrain({ question: 'เกิดอะไรขึ้น', files: [] }), /เปิด.*เอกสาร/);
    assert.match(await askEvidenceBrain({ question: 'เกิดอะไรขึ้น', files: [{ name: 'a.txt', content: 'หลักฐาน' }] }), /API Key/);
    assert.equal((await askEvidenceBrainResult({ question: 'เกิดอะไรขึ้น', files: [{ name: 'a.txt', content: 'หลักฐาน' }] })).ok, false);
  } finally {
    if (oldStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = oldStorage;
  }
});

test('ส่งเอกสารสองฉบับให้ Gemini เปรียบเทียบ พร้อมแสดงแหล่งอ้างอิงจากทั้งสองฉบับ', async () => {
  const oldStorage = globalThis.localStorage;
  const oldFetch = globalThis.fetch;
  globalThis.localStorage = { getItem: () => JSON.stringify({ provider: 'gemini', model: 'gemini-test', apiKey: 'test-key' }) };
  let request;
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ answer: 'เวลาออกจากอาคารในคำให้การไม่ตรงกับบันทึกบัตร', citations: [{ file: 'access_log.txt', quote: 'เวลา 22:25 บัตร M-014 ลงทะเบียนออกจากอาคาร' }, { file: 'witness_statement.txt', quote: 'ผมออกจากอาคารตั้งแต่เวลา 21:30 น. และไม่ได้กลับเข้ามาอีก' }] }) }] } }] }) };
  };
  try {
    const files = getOpenedEvidence(caseFiles, ['access_log.txt', 'witness_statement.txt']);
    const answer = await askEvidenceBrain({ question: 'มีอะไรขัดแย้งกันไหม', files });
    assert.match(answer, /access_log\.txt/);
    assert.match(answer, /witness_statement\.txt/);
    assert.match(JSON.stringify(request), /เวลา 22:25/);
    assert.match(JSON.stringify(request), /เวลา 21:30/);
    assert.doesNotMatch(JSON.stringify(request), /incident_report\.txt/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = oldStorage;
  }
});
