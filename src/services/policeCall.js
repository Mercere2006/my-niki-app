import { POLICE_PREFIX } from './policeConversation.js';
import { followupIntroduction } from './caseFollowup.js';

export const initialNikiMessage = 'ไงชูม! วันนี้เธอเป็นเจ้าหน้าที่สายด่วนนะ ส่วนเรื่องที่เธอเป็นแฮกเกอร์และสร้างฉันขึ้นมา เก็บไว้เป็นความลับระหว่างเราล่ะ';

export const callGreeting = [
  'สวัสดีครับ เจ้าหน้าที่สายด่วน',
  'ผมสายสืบภัทรวัฒน์ อนันต์กุล มีคดีอยากขอให้คุณช่วยตรวจสอบ',
];

export const callChoices = [
  { id: 'direct', label: 'รับทราบ เล่าเรื่องมาได้เลย' },
  { id: 'silent', label: 'ไม่ตอบอะไร' },
];

export const callbackGreeting = 'โถ่คุณเจ้าหน้าที่สายด่วน วางสายผมทำไมเนี่ย';
export const callbackChoice = 'ขอโทษทีครับ พอดีผมกดผิด';

export function isOfficerOffline(reportStage, isFollowupCall, phase) {
  return reportStage === 'complete' && !isFollowupCall && phase !== 'declined';
}

export function getCallbackContinuation(isFollowupCall) {
  return [
    'งั้นเหรอครับ',
    'เพื่อไม่ให้เป็นการเสียเวลา เรามาเข้าเรื่องกันเลยดีกว่า',
    ...(isFollowupCall ? followupIntroduction.slice(1) : getCallBriefing('direct').slice(1)),
  ];
}

export function getCallBriefing(choice) {
  return [
    ...(choice === 'silent' ? ['ยังเงียบเหมือนเดิมเลยนะ', 'งั้นผมเข้าเรื่องเลยก็ได้'] : ['ได้ งั้นเราเข้าเรื่องกันเลยนะ']),
    'เมื่อคืนเกิดเหตุยิงกันที่ลานจอดรถตึกอัยการ เราพบผู้เสียชีวิตหนึ่งคน แต่ยังไม่ทราบชื่อ',
    'กล้องวงจรปิดจับภาพผู้เสียชีวิตและบุคคลอีกคนที่เดินออกจากที่เกิดเหตุไว้ได้',
    'ผมกำลังส่งภาพจากกล้องวงจรปิดไปให้ รบกวนคุณช่วยตรวจสอบให้ทีว่าเขาเป็นใคร',

  ];
}

export function splitCallText(text) {
  if (typeof Intl.Segmenter === 'function') return Array.from(new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text), (part) => part.segment);
  return Array.from(text);
}

export function stripPolicePrefix(text) {
  return text.startsWith(POLICE_PREFIX) ? text.slice(POLICE_PREFIX.length).trimStart() : text;
}
