export function interpretCaseChoice(text) {
  const answer = text.trim().toLowerCase();
  if (!answer) return 'other';

  if (/(?:ไม่|ยังไม่)\s*(?:อยาก|ต้องการ|พร้อมจะ|ขอ)?\s*(?:รับ|ทำ|ช่วย|เอา|ตกลง)|ปฏิเสธ|ขี้เกียจ|\b(?:no|decline)\b/.test(answer)) return 'decline';
  if (/^(?:ไม่|ไม่ค่ะ|ไม่ครับ)[\s.!！]*$/.test(answer)) return 'decline';
  if (/(ง่วง|นอน|พัก|เหนื่อย)/.test(answer) && !/ไม่\s*(ง่วง|นอน|พัก|เหนื่อย)/.test(answer)) return 'decline';
  if (/รับ|ตกลง|ช่วย|ลุย|จัดไป|\b(?:yes|ok|accept)\b/.test(answer) || /^(?:เอา(?:สิ|เลย)?|ได้(?:เลย|สิ)?)(?:ครับ|ค่ะ|นะ)?[\s.!！]*$/.test(answer)) return 'accept';
  return 'other';
}
