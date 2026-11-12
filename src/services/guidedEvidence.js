import { POLICE_PREFIX } from './policeConversation.js';

export const guidedEvidenceQuestions = [
  {
    id: 'access',
    question: 'บันทึกเข้าออกระบุว่าบัตรของใครถูกใช้ และใช้ช่วงเวลาใดบ้าง',
    line: `${POLICE_PREFIX} บันทึกเข้าออกระบุว่าบัตรของใครถูกใช้ และใช้ช่วงเวลาใดบ้าง`,
    requiredFiles: ['access_log.txt'],
  },
  {
    id: 'compare',
    question: 'เวลาที่บัตรถูกใช้สอดคล้องกับคำให้การของธันวาหรือไม่ มีอะไรที่ควรตรวจสอบ',
    line: `${POLICE_PREFIX} เวลาที่บัตรถูกใช้สอดคล้องกับคำให้การของธันวาหรือไม่ มีอะไรที่ควรตรวจสอบ`,
    requiredFiles: ['access_log.txt', 'witness_statement.txt'],
  },
  {
    id: 'timeline',
    mode: 'timeline',
    question: 'ช่วยเรียงลำดับเหตุการณ์จากเอกสารคดีให้ผมหน่อย',
    line: `${POLICE_PREFIX} ช่วยเรียงลำดับเหตุการณ์จากเอกสารคดีให้ผมหน่อย`,
    requiredFiles: ['incident_report.txt', 'access_log.txt', 'witness_statement.txt'],
  },
];

export const guidedEvidenceMessages = [
  `${POLICE_PREFIX} ผมมีคำถามเกี่ยวกับเอกสารที่ส่งไป ช่วยตรวจสอบให้หน่อย`,
  ...guidedEvidenceQuestions.map((item) => item.line),
];

export const initialGuidedSequence = { index: -1, phase: 'pending' };

export function advanceGuidedSequence(state, event, questionCount = guidedEvidenceQuestions.length) {
  if (event === 'delivered' && state.phase === 'pending') {
    return state.index < 0 ? { index: 0, phase: 'pending' } : { ...state, phase: 'ready' };
  }
  if (event === 'success' && state.phase === 'ready') {
    return { ...state, phase: 'review' };
  }
  if (event === 'continue' && state.phase === 'review') {
    return state.index === questionCount - 1 ? { ...state, phase: 'complete' } : { index: state.index + 1, phase: 'pending' };
  }
  return state;
}

export function getMissingGuidedFiles(question, viewedFiles) {
  const viewed = new Set(viewedFiles);
  return question.requiredFiles.filter((name) => !viewed.has(name));
}
