import test from 'node:test';
import assert from 'node:assert/strict';
import { greeting, choices, replyToChoice, POLICE_PREFIX, nextPoliceMessage, interpretDownloadReply, followUpChoices, replyToFollowUp, isCaseDownloadCommand } from '../src/services/policeConversation.js';

test('หลังแจ้งอัปโหลดต้องมีตัวเลือกก่อน NIKI ชวนดาวน์โหลด', () => {
  const reply = replyToChoice('direct').filter(Boolean);
  const uploaded = reply.findIndex((line) => line.includes('อัปโหลด'));
  assert.ok(uploaded > 0);
  assert.equal(nextPoliceMessage(reply.slice(uploaded - 1)).showFollowUp, false);
  const next = nextPoliceMessage(reply.slice(uploaded));
  assert.equal(next.showFollowUp, true);
  assert.match(next.line, /เซิร์ฟเวอร์.*ตำรวจ/);
  assert.equal(next.remaining.length, 0);
  assert.deepEqual(followUpChoices.map(({ label }) => label), ['แค่ภาพจากกล้องวงจรปิด พวกตำรวจยังต้องให้ฉันช่วยอีกเหรอ', 'ไม่ตอบอะไร']);
  assert.deepEqual(replyToFollowUp('silent'), []);
  assert.deepEqual(replyToFollowUp('skeptical'), [
    `${POLICE_PREFIX} แหมคุณแฮ็กเกอร์`,
    `${POLICE_PREFIX} อย่าลืมนะว่าที่คุณยังลอยนวลอยู่ได้เพราะผมเป็นคนเก็บความลับคุณเอาไว้`,
  ]);
});

test('คำสั่งดาวน์โหลดต้องระบุเซิร์ฟเวอร์คดี', () => {
  assert.equal(isCaseDownloadCommand('wget https://police.gov/case_files'), true);
  assert.equal(isCaseDownloadCommand('wget https://elsewhere.example'), false);
  assert.equal(isCaseDownloadCommand('เอาสิ'), false);
});

test('รับคำตอบให้ดาวน์โหลดและไม่ดาวน์โหลดเมื่อปฏิเสธ', () => {
  for (const text of ['ตกลง', 'เอาสิ', 'ช่วยโหลดให้หน่อย', 'ได้เลย', 'yes']) assert.equal(interpretDownloadReply(text), 'accept');
  for (const text of ['ไม่ต้อง', 'ไม่ตกลง', 'ยังไม่ต้องโหลด', 'no']) assert.equal(interpretDownloadReply(text), 'decline');
  for (const text of ['สวัสดี', '', 'เปิดไฟล์']) assert.equal(interpretDownloadReply(text), 'other');
});

test('สายสืบทักก่อนให้เลือกตอบ และระบุเลขเครือข่าย', () => {
  assert.match(greeting.join('\n'), /สวัสดีคุณ Hacker/);
  assert.doesNotMatch(greeting.join('\n'), /กล้องวงจรปิด|wget/);
  assert.deepEqual(choices.map(({ label }) => label), ['เข้าเรื่องเลยเถอะคุณสายสืบ', 'ไม่ตอบอะไร']);
  assert.equal(replyToChoice('direct')[1], 'คุณ : เข้าเรื่องเลยเถอะคุณสายสืบ');
  for (const line of greeting.filter((line) => line.includes('สายสืบภัทรวัฒน์ อนันต์กุล:'))) assert.ok(line.startsWith(POLICE_PREFIX));
});

test('ทั้งสองทางเลือกให้รายละเอียดคดีและวิธีโหลดภาพ', () => {
  for (const choice of choices) {
    const reply = replyToChoice(choice.id).join('\n');
    assert.match(reply, /กล้องวงจรปิด/);
    assert.doesNotMatch(reply, /ภาพอ้างอิง|ภาพทั้งสอง/);
    assert.match(reply, /เซิร์ฟเวอร์.*ตำรวจ/);
    assert.match(reply, /เมื่อคืนมีคนลักลอบเข้าไป/);
    assert.doesNotMatch(reply, /เราพบว่ามีการใช้บัตรของธันวา|กล้องอีกตัวเห็นคนหยิบบัตร/);
    assert.doesNotMatch(reply, /SCADA|Modbus|หม้อแปลง|นายอนันต์/);
  }
});
