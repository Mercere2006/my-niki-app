export function interpretAnalysisReply(text, waitingForAnswer, reportStage) {
  if (reportStage === 'complete') return 'other';
  const normalized = text.trim().toLowerCase();
  if (/(ไม่|อย่า|ยังไม่|no\b|not\b)/i.test(normalized)) return waitingForAnswer ? 'decline' : 'other';
  if (/วิเคราะห์|สแกน|เทียบหน้า|เทียบภาพ|analy[sz]e|scan/.test(normalized)) return 'accept';
  if (waitingForAnswer && /^(เอา(สิ|เลย|ได้)?|ช่วย(ที|เลย|หน่อย)?|ตกลง|ได้(เลย|สิ)?|โอเค|จัดไป|yes|ok|sure)[\s!！.]*$/i.test(normalized)) return 'accept';
  return 'other';
}

export function prepareFaceScan(files) {
  const cctv = files.find((file) => file.kind === 'cctv');
  if (!cctv?.imageUrl) {
    return { ok: false, reason: 'ต้องมีภาพจากกล้องในแฟ้มคดีก่อนจึงจะสแกนได้' };
  }
  return { ok: true, cctv };
}

export function compareFaceDescriptors(left, right, threshold = 0.6) {
  if (!left?.length || left.length !== right?.length || !Number.isFinite(threshold) || threshold <= 0) throw new Error('ข้อมูลใบหน้าสำหรับเปรียบเทียบไม่ครบ');
  let sum = 0;
  for (let i = 0; i < left.length; i++) {
    if (!Number.isFinite(left[i]) || !Number.isFinite(right[i])) throw new Error('ข้อมูลใบหน้าสำหรับเปรียบเทียบไม่ถูกต้อง');
    sum += (left[i] - right[i]) ** 2;
  }
  const distance = Math.sqrt(sum);
  return { distance, matched: distance <= threshold };
}
