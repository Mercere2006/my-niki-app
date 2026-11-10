globalThis.fetch = async (url, options) => {
  const request = JSON.parse(options.body);
  if (!url.includes('/gemini-2.5-test:generateContent') || url.includes('test-private-key') || options.headers['x-goog-api-key'] !== 'test-private-key') throw new Error('unexpected API request');
  const system = request.systemInstruction.parts[0].text;
  const userMessage = request.contents[0].parts[0].text;
  let response;
  if (userMessage.includes('จัดเรียงเหตุการณ์')) {
    response = { events: [{ day: 'incident', time: '22:14', description: 'ภาพจากกล้อง', file: 'incident_report.txt', quote: 'เวลา 22:14 กล้อง CAM 02 บันทึกภาพบุคคลออกจากบริเวณห้องเก็บหลักฐาน' }] };
  } else if (userMessage.includes('บุคคลที่หยิบบัตร')) {
    response = { answer: 'ข้อมูลไม่เพียงพอ', citations: [] };
  } else {
    const match = system.match(/--- ([^\n]+) ---\n([^\n]+)/);
    if (!match) throw new Error('missing evidence');
    response = { answer: 'คำตอบจำลอง', citations: [{ file: match[1], quote: match[2] }] };
  }
  return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(response) }] } }] }) };
};
