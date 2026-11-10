import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretCaseChoice } from '../src/services/caseChoice.js';

test('เข้าใจคำปฏิเสธแม้มีคำว่ารับหรือได้อยู่ในประโยค', () => {
  for (const text of ['ง่วงอะ ไม่รับได้ไหม', 'ไม่รับ', 'ไม่อยากรับคดี', 'ยังไม่ทำ', 'ไม่เอา', 'ขอพักก่อน', 'ง่วงแล้ว', 'no thanks']) {
    assert.equal(interpretCaseChoice(text), 'decline', text);
  }
});

test('รับคดีเฉพาะเมื่อตอบรับ และถามซ้ำเมื่อคำตอบไม่ชัด', () => {
  for (const text of ['รับ', 'รับทำคดี', 'ตกลง', 'ช่วยเลย', 'เอาสิ', 'ได้เลย', 'yes']) assert.equal(interpretCaseChoice(text), 'accept', text);
  for (const text of ['สวัสดี', 'คดีอะไร', 'ไม่แน่ใจ', '']) assert.equal(interpretCaseChoice(text), 'other', text);
});
