import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { caseFiles } from '../src/services/caseFiles.js';
import { askEvidenceBrain, askTimelineBrain } from '../src/services/capriBrain.js';
import { evaluationCases, assessEvidenceResponse, assessTimelineResponse } from '../src/services/aiEvaluation.js';

const runtime = globalThis.process;
const apiKey = runtime.env.NIKI_GEMINI_API_KEY || runtime.env.GEMINI_API_KEY || runtime.env.GOOGLE_API_KEY;
const model = runtime.env.NIKI_GEMINI_MODEL || 'gemini-3.5-flash-lite';

if (!apiKey) {
  console.error('ไม่พบ API Key: ตั้งค่า NIKI_GEMINI_API_KEY ใน environment ก่อนรัน (ดู docs/ai-evaluation.md)');
  runtime.exitCode = 1;
} else if (!/^[a-zA-Z0-9._-]+$/.test(model)) {
  console.error('ชื่อโมเดลไม่ถูกต้อง กรุณาตรวจ NIKI_GEMINI_MODEL');
  runtime.exitCode = 1;
} else {
  const config = { provider: 'gemini', model, apiKey, allowFallback: false, migrateLegacy: false, silentErrors: true };
  const started = new Date();
  const results = [];
  const docsFor = (names) => caseFiles.filter((file) => names.includes(file.name)).map(({ name, content }) => ({ name, content }));

  console.log('กำลังเรียก Gemini API จริงเพื่อประเมิน 10 คำถามและ 1 ไทม์ไลน์');
  for (const item of evaluationCases) {
    const response = await askEvidenceBrain({ question: item.question, files: docsFor(item.files), config });
    const assessment = assessEvidenceResponse(item, response);
    results.push({ ...item, response, ...assessment });
    console.log(item.id + ': ' + assessment.status);
  }

  const timeline = await askTimelineBrain({ files: docsFor(['incident_report.txt', 'access_log.txt', 'witness_statement.txt']), config });
  const timelineAssessment = assessTimelineResponse(timeline);
  console.log('T01: ' + timelineAssessment.status);

  const statusLabel = { indicators_met: 'พบตัวบ่งชี้เบื้องต้น', review: 'ต้องตรวจเพิ่มเติม', error: 'API หรือรูปแบบผลลัพธ์ผิดพลาด' };
  const counts = { indicators_met: 0, review: 0, error: 0 };
  for (const item of [...results, timelineAssessment]) counts[item.status]++;
  const lines = [
    '# รายงานประเมิน AI — NIKI', '',
    'ประเภท: เรียก Gemini API จริง (ข้อมูลคดีสมมติ)',
    'วันที่เวลา: ' + started.toISOString(),
    'โมเดลที่ระบุ: ' + model + ' (ปิดการเปลี่ยนโมเดลอัตโนมัติ)',
    'ตรวจตัวบ่งชี้ผ่าน: ' + counts.indicators_met + ' / 11; ต้องตรวจเพิ่มเติม: ' + counts.review + '; ข้อผิดพลาด: ' + counts.error,
    '',
    '**สำคัญ:** ตัวบ่งชี้ตรวจเฉพาะคำ เวลา ชื่อไฟล์ และรูปแบบเบื้องต้น ไม่ใช่คะแนนความถูกต้องเชิงความหมาย ผู้ประเมินต้องอ่านคำตอบ อ้างอิง และเทียบกับคำตอบคาดหวังทุกข้อ',
    'การตรวจ quote ยืนยันเพียงว่าข้อความปรากฏในไฟล์ ไม่ได้ยืนยันว่าข้อสรุปถูกต้อง', '',
  ];
  for (const item of results) {
    lines.push('## ' + item.id + ' — ' + statusLabel[item.status], '',
      '**คำถาม:** ' + item.question, '', '**ไฟล์ที่ส่ง:** ' + item.files.join(', '), '',
      '**คำตอบคาดหวัง:** ' + item.expected, '', '**ตรวจเบื้องต้น:** ' + item.details, '',
      '**คำตอบจากระบบ:**', '', ...item.response.split('\n').map((line) => '> ' + line), '',
      '**ตรวจโดยผู้ประเมิน:** [ ] ถูกต้อง  [ ] ไม่ถูกต้อง  [ ] ไม่แน่ใจ', '');
  }
  lines.push('## T01 — ' + statusLabel[timelineAssessment.status], '',
    '**คำขอ:** สร้างไทม์ไลน์จากเอกสารคดีทั้งสามฉบับ', '',
    '**คาดหวัง:** เวลา 21:30, 21:40, 21:48, 22:11, 22:14, 22:25 ในวันเกิดเหตุ และ 06:35 ในวันถัดมา พร้อมแหล่งอ้างอิง', '',
    '**ตรวจเบื้องต้น:** ' + timelineAssessment.details, '', '**ผลจากระบบ:**', '');
  if (timeline.ok) for (const event of timeline.events) lines.push('- ' + event.day + ' ' + event.time + ' — ' + event.description + ' [' + event.file + '] “' + event.quote + '”');
  else lines.push('> ' + timeline.error);
  lines.push('', '**ตรวจโดยผู้ประเมิน:** [ ] ถูกต้อง  [ ] ไม่ถูกต้อง  [ ] ไม่แน่ใจ', '');

  const outputDirectory = path.resolve('reports');
  await mkdir(outputDirectory, { recursive: true });
  const reportPath = path.join(outputDirectory, 'niki-ai-evaluation-' + started.toISOString().replace(/[:.]/g, '-') + '.md');
  await writeFile(reportPath, lines.join('\n'), 'utf8');
  console.log('บันทึกรายงานแล้ว: ' + reportPath);
  console.log('โปรดตรวจความถูกต้องเชิงความหมายและแหล่งอ้างอิงด้วยตนเองทุกข้อ');
  if (counts.error) runtime.exitCode = 1;
}
