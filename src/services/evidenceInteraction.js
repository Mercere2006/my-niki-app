const statement = {
  id: 'statement-exit', file: 'krit_statement.txt',
  quote: 'กฤตภาสให้การว่าคืนเกิดเหตุเขาอยู่ที่ตึกอัยการเพื่อทำงาน และออกจากอาคารเวลา 21:54 น.',
  answer: 'คำให้การ: กฤตภาสบอกว่าออกจากอาคารเวลา 21:54 น.',
};
const access = {
  id: 'access-2211', file: 'parking_access_log.txt',
  quote: '22:11 น. บัตร K-027 ถูกใช้ที่ประตูทางเข้าลานจอดรถ',
  answer: 'บันทึกเข้าออก: 22:11 น. บัตร K-027 ถูกใช้ที่ประตูทางเข้าลานจอดรถ',
};
const camera = {
  id: 'camera-2213', file: 'parking_incident_report.txt',
  quote: '22:13 น. กล้อง CAM 02 บันทึกภาพบุคคลสองคนในลานจอดรถ',
  answer: '22:13 น. กล้อง CAM 02 บันทึกภาพบุคคลสองคนในลานจอดรถ',
};
const incident = {
  id: 'incident-2214', file: 'parking_incident_report.txt',
  quote: '22:14 น. กล้องบันทึกเหตุยิง ผู้บาดเจ็บคือธันวา วรากร ซึ่งเสียชีวิตในเวลาต่อมา',
  answer: '22:14 น. กล้องบันทึกเหตุยิง ผู้บาดเจ็บคือธันวา วรากร ซึ่งเสียชีวิตในเวลาต่อมา',
};
const discovery = {
  id: 'discovery-2225', file: 'parking_incident_report.txt',
  quote: '22:25 น. เจ้าหน้าที่รักษาความปลอดภัยพบผู้บาดเจ็บในลานจอดรถ',
  answer: '22:25 น. เจ้าหน้าที่รักษาความปลอดภัยพบผู้บาดเจ็บในลานจอดรถ',
};

const evidenceByQuestion = {
  statement: [statement],
  compare: [statement, access],
  timeline: [statement, access, camera, incident, discovery],
};

export function interpretEvidenceOffer(text) {
  const value = String(text ?? '').trim().toLowerCase().replace(/[’‘]/g, "'");
  if (!value) return 'other';
  if (/^ไม่(?:\s|$|[!,.])|ไม่(?:เอา|ต้อง|เป็นไร|ล่ะ|ละ|ได้|ให้|อยาก|ครับ|ค่ะ|อ่ะ|อะ|หรอก|ช่วย|ดีกว่า)|อย่า|(?:หา|ทำ|ดู|ตรวจ|วิเคราะห์)เอง|(?:ฉัน|ผม|เรา).*เอง|\b(?:no|nope|not|don't|dont)\b/.test(value)) return 'decline';
  if (/ช่วย|วิเคราะห์ให้|หาคำตอบให้|เอา(?:สิ|ดิ|เลย|ได้)?|ตกลง|ได้(?:เลย|สิ|ดิ|ครับ|ค่ะ)?|โอเค|จัดไป|^(?:เค|ok|okay|yes|sure)(?:\s|$|[!,.])/.test(value)) return 'accept';
  return 'other';
}

export function isEvidenceHelpRequest(text, { awaitingReply = false } = {}) {
  const value = String(text ?? '').normalize('NFC').replace(/\u0e4d\u0e32/g, 'ำ').toLowerCase().replace(/\s+/g, '').trim();
  if (!value || interpretEvidenceOffer(value) === 'decline') return false;
  const asksForEvidence = /^ช่วย(?:ฉัน|ผม|เรา|ชั้น|ชูม)?(?:(?:หา|ค้น)(?:คำตอบ|ข้อมูล|หลักฐาน)?|(?:ตอบ|ตรวจ|วิเคราะห์|สรุป|เรียง)(?:คำตอบ|คำถาม|ข้อมูล|หลักฐาน|เอกสาร|ไทม์ไลน์|เหตุการณ์)?|หน่อย|ที|ด้วย)?(?:ให้(?:ฉัน|ผม|เรา)?|หน่อย|ที|ด้วย|นะ|ได้ไหม|ได้มั้ย|ครับ|ค่ะ|คะ|สิ|ดิ|เลย|เถอะ|ๆ)*[.!?]*$/.test(value);
  const acceptsOffer = /^(?:เอาสิ|เอาดิ|เอาเลย|เอา|ตกลง|ได้|ได้สิ|ได้ดิ|ได้เลย|โอเค|เค|จัดไป|ok|okay|yes|sure)(?:ครับ|ค่ะ|คะ|นะ|เลย|[.!?])*$/i.test(value);
  return asksForEvidence || (awaitingReply && acceptsOffer);
}

export function getManualEvidence(questionId) {
  return evidenceByQuestion[questionId] || [];
}

export function getManualEvidenceResult(questionId, selectedIds) {
  const items = getManualEvidence(questionId);
  const selected = new Set(Array.isArray(selectedIds) ? selectedIds : []);
  const complete = items.length > 0 && items.every((item) => selected.has(item.id));
  return { complete, selectedCount: items.filter((item) => selected.has(item.id)).length, total: items.length, answer: complete ? items.map((item) => item.answer).join('\n') : '' };
}
