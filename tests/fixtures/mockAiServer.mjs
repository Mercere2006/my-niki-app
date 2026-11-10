import { createServer } from 'node:http';

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
  if (request.method !== 'POST' || request.url !== '/v1/chat/completions') { response.writeHead(404); response.end(); return; }
  let body = '';
  for await (const chunk of request) body += chunk;
  const payload = JSON.parse(body);
  const isTimeline = payload.messages.some((message) => message.content.includes('จัดเรียงเหตุการณ์ตามเวลา'));
  const data = isTimeline ? { events: [
    { day: 'next', time: '06:35', description: 'นำบัตรมาคืนที่โต๊ะ', file: 'incident_report.txt', quote: 'นำบัตรมาวางคืนเวลา 06:35 ของเช้าวันถัดมา' },
    { day: 'incident', time: '22:11', description: 'บัตรถูกใช้เปิดห้อง', file: 'access_log.txt', quote: 'เวลา 22:11 บัตร M-014 ถูกใช้เปิดประตูห้องเก็บหลักฐาน' },
    { day: 'incident', time: '21:30', description: 'ธันวาให้การว่าออกจากอาคาร', file: 'witness_statement.txt', quote: 'ผมออกจากอาคารตั้งแต่เวลา 21:30 น. และไม่ได้กลับเข้ามาอีก' },
  ] } : (() => {
    const evidence = payload.messages[0].content.match(/--- ([^\n]+) ---\n([^\n]+)/);
    return evidence ? { answer: 'ผลวิเคราะห์จำลองสำหรับทดสอบ', citations: [{ file: evidence[1], quote: evidence[2] }] } : { answer: 'ไม่มีข้อมูล', citations: [] };
  })();
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(data) } }] }));
});

server.listen(0, '127.0.0.1', () => console.log('MOCK_AI_PORT=' + server.address().port));
