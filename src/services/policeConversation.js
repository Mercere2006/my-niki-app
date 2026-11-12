export const POLICE_PREFIX = '[10.200.4.1] สายสืบภัทรวัฒน์ อนันต์กุล:';
export const UPLOAD_NOTICE = `${POLICE_PREFIX} ผมจะอัปโหลดภาพจากกล้องวงจรปิดและเอกสารคดีไว้ที่เซิร์ฟเวอร์ของตำรวจ คุณโหลดมาเองนะ`;
export const NIKI_DOWNLOAD_OFFER = 'ดูเหมือนต้องโหลดไฟล์สินะ ชูมจะให้ฉันดาวน์โหลดให้ไหม?';
export const DOWNLOAD_COMMAND = 'wget https://police.gov/case_files';

export function nextPoliceMessage(pendingLines) {
  const [line, ...remaining] = pendingLines;
  return { line, remaining, showFollowUp: line === UPLOAD_NOTICE };
}

export function isCaseDownloadCommand(text) {
  return /^wget\s+https:\/\/police\.gov\/case_files\/?$/i.test(text.trim());
}

export function interpretDownloadReply(text) {
  const answer = text.trim().toLowerCase();
  if (!answer) return 'other';
  if (/ไม่|อย่า|ยังไม่|\bno\b|\bnot\b/.test(answer)) return 'decline';
  if (/โหลด|ดาวน์โหลด|\bdownload\b/.test(answer)) return 'accept';
  if (/^(ตกลง|เอา(สิ|เลย|ได้)?|ได้(เลย|สิ)?|โอเค|จัดไป|ช่วย(ที|เลย|หน่อย)?|yes|ok|sure)(ครับ|ค่ะ|จ้า|นะ)?[\s!！.]*$/.test(answer)) return 'accept';
  return 'other';
}

export const greeting = [
  '',
  '[+] เชื่อมต่อช่องสื่อสารเข้ารหัสกับสายสืบภัทรวัฒน์ อนันต์กุลแล้ว',
  '',
  `${POLICE_PREFIX} สวัสดีคุณ Hacker`,
  `${POLICE_PREFIX} ไม่ได้คุยกันนานเลยนะ`,
];

export const choices = [
  { id: 'direct', label: 'เข้าเรื่องเลยเถอะคุณสายสืบ' },
  { id: 'silent', label: 'ไม่ตอบอะไร' },
];

export const followUpChoices = [
  { id: 'skeptical', label: 'แค่ภาพจากกล้องวงจรปิด พวกตำรวจยังต้องให้ฉันช่วยอีกเหรอ' },
  { id: 'silent', label: 'ไม่ตอบอะไร' },
];

export function replyToFollowUp(choice) {
  return choice === 'skeptical' ? [
    `${POLICE_PREFIX} แหมคุณแฮ็กเกอร์`,
    `${POLICE_PREFIX} อย่าลืมนะว่าที่คุณยังลอยนวลอยู่ได้เพราะผมเป็นคนเก็บความลับคุณเอาไว้`,
  ] : [];
}

export function replyToChoice(choice) {
  return [
    '',
    choice === 'direct' ? 'คุณ : เข้าเรื่องเลยเถอะคุณสายสืบ' : '[คุณไม่ได้ตอบอะไร]',
    '',
    choice === 'silent'
      ? `${POLICE_PREFIX} ยังเงียบเหมือนเดิมเลยนะ`
      : `${POLICE_PREFIX} ได้ งั้นเราเข้าเรื่องกันเลยนะ`,
    ...(choice === 'silent' ? [`${POLICE_PREFIX} งั้นผมเข้าเรื่องเลยก็ได้`] : []),
    `${POLICE_PREFIX} เมื่อคืนมีคนลักลอบเข้าไปในห้องเก็บหลักฐานที่ตึกอัยการ และเอกสารสำคัญหายไป`,
    `${POLICE_PREFIX} กล้องวงจรปิดจับภาพคนคนนึงที่ออกมาจากห้องนั้นช่วงเกิดเหตุไว้ได้`,
    `${POLICE_PREFIX} ภาพไม่ชัด ผมอยากให้คุณช่วยตรวจว่าคนในภาพเป็นใคร`,
    UPLOAD_NOTICE,
  ];
}
