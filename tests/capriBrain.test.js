import test from 'node:test';
import assert from 'node:assert/strict';
import { askCapriBrain } from '../src/services/capriBrain.js';

test('หลังส่งเบาะแสแล้ว NIKI ไม่แนะนำให้เริ่มสืบคดีใหม่', async () => {
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null };
  try {
    const reply = await askCapriBrain({ userMessage: 'สายสืบภัทรวัฒน์ อนันต์กุลไปแล้ว', gameState: 'CASE_CLOSED' });
    assert.match(reply, /สายสืบ.*ดูแลต่อ/);
    assert.doesNotMatch(reply, /Case_Files|สแกนหน้า/);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});

test('บริบท AI หลังรับสายมีเฉพาะข้อความที่สายสืบพูดแล้ว และไม่สมมติว่าภาพถูกส่ง', async () => {
  const originalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  let payload;
  globalThis.localStorage = { getItem: () => JSON.stringify({ provider: 'openai', apiKey: 'test-key', model: 'test-model' }) };
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'โอเคชูม ความลับของเราปลอดภัย' } }] }) };
  };
  try {
    await askCapriBrain({ userMessage: 'สายสืบพูดว่าอะไร', gameState: 'ACTIVE', policeConversation: 'choosing', attachmentStage: 'waiting', policeMessages: ['สวัสดีครับ เจ้าหน้าที่สายด่วน', 'ผมสายสืบภัทรวัฒน์ อนันต์กุล มีคดีอยากขอให้คุณช่วยตรวจสอบ'], history: [{ sender: 'NIKI', text: 'เรื่องที่เธอเป็นแฮกเกอร์ เก็บไว้เป็นความลับนะ' }, { sender: 'INSP. PHATTARA', text: 'สายสืบโทรเข้า' }] });
    const prompt = payload.messages[0].content;
    assert.match(prompt, /ผมสายสืบภัทรวัฒน์ อนันต์กุล มีคดีอยากขอให้คุณช่วยตรวจสอบ/);
    assert.match(prompt, /ยังไม่มีไฟล์แนบ/);
    assert.doesNotMatch(prompt, /สายสืบภัทรวัฒน์ อนันต์กุลส่งภาพจากกล้องวงจรปิดให้ตรวจสอบ|เอกสารสำคัญหายจากห้องเก็บหลักฐาน/);
    assert.ok(payload.messages.some((message) => message.role === 'assistant' && message.content.includes('เก็บไว้เป็นความลับ')));
    assert.ok(!payload.messages.some((message) => message.content === 'สายสืบโทรเข้า'));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  }
});

test('คำตอบสำรองไม่แนะนำเปิดไฟล์คดีที่ยังไม่ถูกส่ง', async () => {
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null };
  try {
    const reply = await askCapriBrain({ userMessage: 'ภาพอยู่ไหน', gameState: 'ACTIVE', policeConversation: 'choosing', attachmentStage: 'waiting', policeMessages: [] });
    assert.doesNotMatch(reply, /เปิดภาพ|Case_Files|ส่งภาพมาแล้ว/);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});

test('บริบทแยกไฟล์แนบที่ส่งแล้วออกจากไฟล์ที่ตรวจและเปิดแล้ว', async () => {
  const originalStorage = globalThis.localStorage;
  const originalFetch = globalThis.fetch;
  let prompt;
  globalThis.localStorage = { getItem: () => JSON.stringify({ provider: 'openai', apiKey: 'test-key', model: 'test-model' }) };
  globalThis.fetch = async (_url, options) => {
    prompt = JSON.parse(options.body).messages[0].content;
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'ได้เลยชูม' } }] }) };
  };
  try {
    await askCapriBrain({ userMessage: 'ไฟล์อยู่ไหน', gameState: 'ACTIVE', policeConversation: 'briefed', attachmentStage: 'ready', policeMessages: ['ผมกำลังส่งภาพจากกล้องวงจรปิดไปให้'] });
    assert.match(prompt, /ไฟล์แนบ.*พร้อม.*กด/);
    assert.doesNotMatch(prompt, /ภาพถูกตรวจและเปิดแล้ว/);
    await askCapriBrain({ userMessage: 'ไฟล์อยู่ไหน', gameState: 'ACTIVE', policeConversation: 'briefed', attachmentStage: 'complete', hasDownloadedCaseFiles: true, policeMessages: ['ผมกำลังส่งภาพจากกล้องวงจรปิดไปให้'] });
    assert.match(prompt, /ภาพถูกตรวจและเปิดแล้ว/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage;
  }
});


test('ตอบโอเคหลังสายขัดจังหวะยังต่อเนื่องจากข้อความเรื่องความลับ', async () => {
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null };
  try {
    const reply = await askCapriBrain({ userMessage: 'โอเค', gameState: 'ACTIVE', policeConversation: 'choosing', attachmentStage: 'waiting', history: [
      { sender: 'NIKI', text: 'ไงชูม! วันนี้เธอเป็นเจ้าหน้าที่สายด่วนนะ ส่วนเรื่องที่เธอเป็นแฮกเกอร์และสร้างฉันขึ้นมา เก็บไว้เป็นความลับระหว่างเราล่ะ' },
      { sender: 'NIKI', text: 'ชูม สายสืบภัทรวัฒน์ อนันต์กุลโทรเข้ามาแล้ว กดรับสายได้เลย' },
      { sender: 'SHOOM', text: 'รับสายจากสายสืบภัทรวัฒน์ อนันต์กุล' },
      { sender: 'NIKI', text: 'รับสายแล้วชูม ฉันจะอยู่ตรงนี้ถ้าต้องการความช่วยเหลือ' },
    ] });
    assert.match(reply, /ความลับ/);
    assert.doesNotMatch(reply, /กล้อง|สแกน|Case_Files/);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});
