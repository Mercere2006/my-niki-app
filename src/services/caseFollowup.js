import { POLICE_PREFIX } from './policeConversation.js';

export const FOLLOWUP_DELAY_MS = 5000;
export const INTERTITLE_MS = 4000;

// The files and threat flags belong to the game's fictional scenario.
export function inspectSimulatedDocuments(files) {
  if (!Array.isArray(files) || !files.length || files.some((file) => !file || typeof file.name !== 'string' || !file.name.trim() || typeof file.content !== 'string' || !file.content.trim())) return { ok: false };
  return { ok: true, hasThreat: files.some((file) => file.simulatedThreat === true) };
}

export function nextFollowupPhase(phase, event) {
  if (event === 'elapsed' && phase === 'pending') return 'intertitle';
  if (event === 'elapsed' && phase === 'intertitle') return 'ringing';
  if (event === 'answer' && phase === 'ringing') return 'active';
  return phase;
}

export const followupIntroduction = [
  'สวัสดีอีกครั้งครับเจ้าหน้าที่ ผมมีข้อมูลเพิ่มเติมเกี่ยวกับคดียิงที่ลานจอดรถ',
  'ผมสอบปากคำกฤตภาสแล้ว และได้บันทึกการใช้บัตรกับรายงานเหตุมาเพิ่มเติม',
  'ผมกำลังส่งเอกสารให้ รบกวนคุณช่วยตรวจสอบแล้วเรียงเหตุการณ์ให้ที',
];

export const followupFiles = [
  {
    name: 'krit_statement.txt', icon: '📝', type: 'คำให้การ', kind: 'document',
    description: 'บันทึกคำให้การของกฤตภาส นิลวัฒน์',
    content: `บันทึกคำให้การ // กฤตภาส นิลวัฒน์
กฤตภาสให้การว่าคืนเกิดเหตุเขาอยู่ที่ตึกอัยการเพื่อทำงาน และออกจากอาคารเวลา 21:54 น.
เขาบอกว่าไม่ได้กลับเข้ามาอีก และปฏิเสธว่าเกี่ยวข้องกับเหตุยิงที่ลานจอดรถ และเขาเองก็ไม่ได้รู้จักกับนายธันวา วรากรเป็นการส่วนตัว จึงไม่มีเหตุผลอะไรที่จะไปทำร้ายนายธันวา วรากร
หมายเหตุ: ข้อมูลนี้เป็นคำให้การ ต้องตรวจสอบกับหลักฐานอื่น`,
  },
  {
    name: 'parking_access_log.txt', icon: '📋', type: 'บันทึกเข้าออก', kind: 'document',
    description: 'บันทึกการใช้บัตรบริเวณตึกและลานจอดรถ',
    content: `บันทึกระบบเข้าออก // ตึกอัยการ
ทะเบียนบัตร K-027: กฤตภาส นิลวัฒน์
21:54 น. บัตร K-027 ลงทะเบียนออกจากอาคาร
22:11 น. บัตร K-027 ถูกใช้ที่ประตูทางเข้าลานจอดรถ
หมายเหตุ: ระบบบันทึกหมายเลขบัตร ไม่ได้ยืนยันว่าเจ้าของบัตรเป็นผู้ใช้`,
  },
  {
    name: 'parking_incident_report.txt', icon: '📄', type: 'รายงานเหตุ', kind: 'document',
    description: 'รายงานเหตุยิงบริเวณลานจอดรถตึกอัยการ',
    content: `รายงานเหตุ // ลานจอดรถตึกอัยการ
22:13 น. กล้อง CAM 02 บันทึกภาพบุคคลสองคนในลานจอดรถ
22:14 น. กล้องบันทึกเหตุยิง ผู้บาดเจ็บคือธันวา วรากร ซึ่งเสียชีวิตในเวลาต่อมา
22:25 น. เจ้าหน้าที่รักษาความปลอดภัยพบผู้บาดเจ็บในลานจอดรถ
ภาพบุคคลอีกคนมีคุณภาพต่ำ ผลตรวจเบื้องต้นระบุว่าอาจเป็นกฤตภาส แต่ยังต้องตรวจสอบเพิ่มเติม`,
  },
];

export const followupQuestions = [
  {
    id: 'compare', question: 'เมื่อเทียบคำให้การกับบันทึกการใช้บัตร มีจุดใดที่ควรตรวจสอบเพิ่มเติม',
    requiredFiles: ['krit_statement.txt', 'parking_access_log.txt'],
  },
  {
    id: 'timeline', mode: 'timeline', question: 'ช่วยเรียงลำดับเหตุการณ์จากเอกสารคดีให้ผมหน่อย',
    requiredFiles: ['krit_statement.txt', 'parking_access_log.txt', 'parking_incident_report.txt'],
  },
].map((question) => ({ ...question, line: `${POLICE_PREFIX} ${question.question}` }));

export const followupAcknowledgements = [
  'ขอบคุณครับ ผมจะตรวจสอบเรื่องการใช้บัตรเพิ่มเติม',
  'ขอบคุณครับ ผมจะนำลำดับเหตุการณ์นี้ไปตรวจสอบต่อ',
];

export function formatTimelineReply(events) {
  return events.map((event) => `${event.day === 'next' ? 'วันถัดมา ' : ''}${event.time} น. ${event.description}`).join('\n');
}
