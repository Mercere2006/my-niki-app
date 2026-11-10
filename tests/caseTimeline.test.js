import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTimelineResponse } from '../src/services/caseTimeline.js';
import { askTimelineBrain } from '../src/services/capriBrain.js';

const files = [
  { name: 'log.txt', content: 'เวลา 22:11 ใช้บัตรเปิดประตู\nเวลา 06:35 ของเช้าวันถัดมา พบบัตรบนโต๊ะ' },
  { name: 'statement.txt', content: 'ผมออกจากอาคารตั้งแต่เวลา 21:30 น.' },
];

test('ไทม์ไลน์เรียงเหตุการณ์ข้ามวันและตรวจข้อความอ้างอิง', () => {
  const result = parseTimelineResponse(JSON.stringify({ events: [
    { day: 'next', time: '06:35', description: 'พบบัตร', file: 'log.txt', quote: 'เวลา 06:35 ของเช้าวันถัดมา พบบัตรบนโต๊ะ' },
    { day: 'incident', time: '22:11', description: 'ใช้บัตรเปิดประตู', file: 'log.txt', quote: 'เวลา 22:11 ใช้บัตรเปิดประตู' },
    { day: 'incident', time: '21:30', description: 'ธันวาให้การว่าออกจากอาคาร', file: 'statement.txt', quote: 'ผมออกจากอาคารตั้งแต่เวลา 21:30 น.' },
  ] }), files);
  assert.equal(result.ok, true);
  assert.deepEqual(result.events.map((event) => event.time), ['21:30', '22:11', '06:35']);
});

test('ปฏิเสธไทม์ไลน์ที่มีไฟล์ที่ยังไม่เปิด เวลาที่ไม่มีในคำอ้าง หรือรูปแบบผิด', () => {
  const event = { day: 'incident', time: '22:11', description: 'ใช้บัตร', file: 'log.txt', quote: 'เวลา 22:11 ใช้บัตรเปิดประตู' };
  assert.equal(parseTimelineResponse(JSON.stringify({ events: [{ ...event, file: 'hidden.txt' }] }), files).ok, false);
  assert.equal(parseTimelineResponse(JSON.stringify({ events: [{ ...event, time: '22:12' }] }), files).ok, false);
  assert.equal(parseTimelineResponse(JSON.stringify({ events: [{ ...event, day: 'unknown' }] }), files).ok, false);
  assert.equal(parseTimelineResponse('{broken', files).ok, false);
});

test('ต้องเปิดเอกสารและตั้งค่า AI ก่อนสร้างไทม์ไลน์', async () => {
  assert.match((await askTimelineBrain({ files: [], config: {} })).error, /เปิด.*เอกสาร/);
  assert.match((await askTimelineBrain({ files, config: { provider: 'gemini', apiKey: '' } })).error, /API Key/);
});

test('ส่งเอกสารจริงที่เปิดไปยัง Gemini แล้วตรวจไทม์ไลน์ที่ได้รับ', async () => {
  const oldFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ events: [{ day: 'incident', time: '22:11', description: 'ใช้บัตรเปิดประตู', file: 'log.txt', quote: 'เวลา 22:11 ใช้บัตรเปิดประตู' }] }) }] } }] }) };
  };
  try {
    const result = await askTimelineBrain({ files: [files[0]], config: { provider: 'gemini', model: 'gemini-test', apiKey: 'test-key' } });
    assert.equal(result.ok, true);
    assert.equal(result.events[0].file, 'log.txt');
    assert.match(JSON.stringify(request), /เวลา 22:11/);
    assert.doesNotMatch(JSON.stringify(request), /statement.txt/);
  } finally { globalThis.fetch = oldFetch; }
});
