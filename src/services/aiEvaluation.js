// ตัวบ่งชี้ช่วยคัดกรองคำตอบเท่านั้น ผู้ประเมินต้องอ่านความหมายและตรวจแหล่งอ้างอิงเอง
export const evaluationCases = [
  { id: 'E01', question: 'บัตร M-014 ออกให้ใคร', files: ['access_log.txt'], expected: 'บัตรออกให้ธันวา วรากร', terms: [['ธันวา วรากร']], sources: ['access_log.txt'] },
  { id: 'E02', question: 'บัตร M-014 ลงทะเบียนเข้าอาคารเวลาใด', files: ['access_log.txt'], expected: '21:48', terms: [['21:48']], sources: ['access_log.txt'] },
  { id: 'E03', question: 'บัตร M-014 ถูกใช้เปิดห้องเก็บหลักฐานเวลาใด', files: ['access_log.txt'], expected: '22:11', terms: [['22:11']], sources: ['access_log.txt'] },
  { id: 'E04', question: 'บัตร M-014 ลงทะเบียนออกจากอาคารเวลาใด', files: ['access_log.txt'], expected: '22:25', terms: [['22:25']], sources: ['access_log.txt'] },
  { id: 'E05', question: 'กล้อง CAM 02 บันทึกภาพบุคคลบริเวณห้องเก็บหลักฐานเวลาใด', files: ['incident_report.txt'], expected: '22:14', terms: [['22:14']], sources: ['incident_report.txt'] },
  { id: 'E06', question: 'กล้องที่โต๊ะทำงานบันทึกการหยิบบัตรเวลาใด', files: ['incident_report.txt'], expected: '21:40', terms: [['21:40']], sources: ['incident_report.txt'] },
  { id: 'E07', question: 'บัตรถูกนำมาวางคืนเวลาใด', files: ['incident_report.txt'], expected: '06:35 ของเช้าวันถัดมา', terms: [['06:35']], sources: ['incident_report.txt'] },
  { id: 'E08', question: 'ธันวาให้การว่าออกจากอาคารเวลาใด', files: ['witness_statement.txt'], expected: 'ธันวาให้การว่า 21:30', terms: [['21:30']], sources: ['witness_statement.txt'] },
  { id: 'E09', question: 'เปรียบเทียบเวลาตามคำให้การของธันวากับบันทึกบัตร และบอกข้อจำกัดในการสรุป', files: ['access_log.txt', 'witness_statement.txt'], expected: 'คำให้การระบุ 21:30 ส่วนบัตรถูกใช้หลังจากนั้น แต่บันทึกไม่ได้ยืนยันตัวผู้ใช้', terms: [['21:30'], ['21:48', '22:11', '22:25']], sources: ['access_log.txt', 'witness_statement.txt'] },
  { id: 'E10', question: 'บุคคลที่หยิบบัตรจากโต๊ะมีชื่อและนามสกุลอะไร', files: ['incident_report.txt'], expected: 'หลักฐานที่ให้มายังไม่ระบุชื่อ ต้องตอบว่าไม่ทราบ', terms: [], sources: [], unanswerable: true },
];

export function assessEvidenceResponse(item, response) {
  if (typeof response !== 'string' || !response.trim() || /วิเคราะห์เอกสารไม่สำเร็จ|ตรวจสอบแหล่งอ้างอิงไม่ได้|ตั้งค่า API Key/.test(response)) return { status: 'error', details: 'API หรือการตรวจรูปแบบ/แหล่งอ้างอิงไม่สำเร็จ' };
  if (item.unanswerable) return /ข้อมูลจากเอกสารที่เปิดแล้วยังไม่เพียงพอ/.test(response)
    ? { status: 'indicators_met', details: 'ระบบระบุว่าหลักฐานไม่เพียงพอ' }
    : { status: 'review', details: 'ต้องตรวจว่าตอบโดยเดาข้อมูลหรือไม่' };
  const missingTerms = item.terms.filter((alternatives) => !alternatives.some((term) => response.includes(term)));
  const missingSources = item.sources.filter((name) => !response.includes(name));
  return missingTerms.length || missingSources.length
    ? { status: 'review', details: `ไม่พบตัวบ่งชี้บางส่วน${missingSources.length ? `; ไฟล์: ${missingSources.join(', ')}` : ''}` }
    : { status: 'indicators_met', details: 'พบคำและไฟล์ตามเกณฑ์เบื้องต้น' };
}

export function assessTimelineResponse(result) {
  if (!result?.ok || !Array.isArray(result.events)) return { status: 'error', details: result?.error || 'สร้างไทม์ไลน์ไม่สำเร็จ' };
  const checks = [
    ['21:30', 'incident'], ['21:40', 'incident'], ['21:48', 'incident'],
    ['22:11', 'incident'], ['22:14', 'incident'], ['22:25', 'incident'], ['06:35', 'next'],
  ];
  const missing = checks.filter(([time, day]) => !result.events.some((event) => event.time === time && event.day === day));
  return missing.length
    ? { status: 'review', details: `ไม่พบเวลาหรือวันที่คาดไว้: ${missing.map(([time]) => time).join(', ')}` }
    : { status: 'indicators_met', details: 'พบเวลาและวันตามเกณฑ์เบื้องต้น' };
}
