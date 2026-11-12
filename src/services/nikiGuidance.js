export function isGuidanceRequest(text) {
  const value = String(text ?? '').normalize('NFC').replace(/\u0e4d\u0e32/g, 'ำ').toLowerCase().replace(/\s+/g, ' ').trim();
  return /(?:ทำ|ไป|เริ่ม|เล่น|ขั้นตอน|ต้อง|ควร|ต่อไป).{0,20}(?:อะไร|ยังไง|อย่างไร|ไงต่อ)|(?:ทำ|ไป|เล่น|เริ่ม).{0,12}(?:ไง|ไร|ไหน)(?:ต่อ|ดี)|(?:อะไร|ยังไง|อย่างไร|ไง).{0,12}ต่อ|(?:ช่วย)?(?:ไกด์|แนะนำ)(?:หน่อย|ที|ด้วย|การเล่น|ขั้นตอน)|\b(?:what(?:\s+should\s+i)?\s+(?:do\s+)?next|what\s+do\s+i\s+do|how\s+do\s+i\s+continue)\b/.test(value);
}

function folderHint(name, location) {
  if (location === 'trash') return `${name} อยู่ในถังขยะนะชูม เปิด Trash แล้วกู้คืนโฟลเดอร์ก่อน`;
  if (location === 'deleted') return `${name} ถูกลบถาวรไปแล้ว จึงเปิดหลักฐานในโฟลเดอร์นี้ไม่ได้`;
  return null;
}

function attachmentHint(stage, name) {
  if (stage === 'ready' || stage === 'error') return `เปิดสายสนทนา แล้วกดโฟลเดอร์ ${name} ที่สายสืบส่งมา เพื่อให้ฉันตรวจไฟล์ก่อนนะชูม`;
  if (['uploading', 'checking', 'scanning', 'cleaning'].includes(stage)) return `รอให้ ${name} รับและตรวจไฟล์เสร็จก่อนนะชูม`;
  return 'รอให้สายสืบส่งข้อมูลในสายให้เรียบร้อยก่อนนะชูม';
}

function scanHint(context, subject, folder, location, label) {
  if (context.scanSubject === subject && context.scanStage === 'complete') {
    return `สแกนเสร็จแล้วชูม ${context.knownPersonName ? `คัดลอกชื่อ ${context.knownPersonName} จากผลสแกน แล้ว` : ''}เปิด HumanDB ค้นชื่อเต็ม และตรวจแฟ้มก่อนส่งให้สายสืบนะ`;
  }
  const unavailable = folderHint(folder, location);
  if (unavailable) return unavailable;
  if (context.scanSubject === subject && ['scanning', 'low-quality', 'analyzing'].includes(context.scanStage)) {
    if (!context.isScannerOpen) return `เปิด ${folder} เลือก${label} แล้วคลิกที่ใบหน้าเพื่อเริ่มสแกนอีกครั้งนะชูม`;
    return context.isScannerMinimized ? 'เปิดหน้าต่างเครื่องสแกนจากแถบงานอีกครั้ง แล้วรอผลตรวจนะชูม' : 'รอให้เครื่องสแกนตรวจภาพเสร็จก่อนนะชูม';
  }
  return `เปิด ${folder} บนเดสก์ท็อป เลือก${label} แล้วคลิกที่ใบหน้าเพื่อสแกนนะชูม`;
}

export function getNextStepGuidance(context = {}) {
  if (context.policeConversation === 'declined') return context.callEndReason === 'missed' ? 'ชูมไม่ได้รับสาย เปิดหน้าสายสนทนาแล้วกดโทรกลับหาสายสืบได้เลย' : 'ชูมวางสายไปแล้ว เปิดหน้าสายสนทนาแล้วกดโทรกลับหาสายสืบได้เลย';
  if (context.hasIncomingCase || context.followupPhase === 'ringing') return 'มีสายจากภัทรวัฒน์เข้ามา เปิดหน้าสายสนทนาแล้วกดรับสายได้เลยชูม';
  if (context.policeConversation === 'choosing' || context.policeConversation === 'callback-choosing') return 'เลือกคำตอบในช่องสนทนาของสายสืบก่อนนะชูม';
  if (context.callQueueLength > 0 || context.reportHasPending) return context.isCallMinimized ? 'เปิดสายของภัทรวัฒน์จากแถบด้านบนอีกครั้ง แล้วรอข้อความต่อไปนะชูม' : 'รอให้ภัทรวัฒน์ส่งข้อความในสายให้เสร็จก่อนนะชูม';

  if (context.followupPhase === 'active') {
    if (context.endingStage === 'complete') return 'คดีนี้ส่งให้ภัทรวัฒน์เรียบร้อยแล้วชูม ตอนนี้คุยเล่นกับฉันได้เลย';
    if (context.endingStage === 'apology') return 'กดตัวเลือกในกล่องข้อความของฉันได้เลยนะชูม';
    if (context.endingStage === 'closing') return 'รอภัทรวัฒน์ตอบกลับในสายอีกสักครู่นะชูม';
    if (context.endingStage === 'awaiting-name') return 'พบแฟ้มที่ต้องการแล้วชูม เปิดสายสนทนาแล้วกดส่งชื่อให้ภัทรวัฒน์ได้เลย';
    if (context.endingStage === 'awaiting-upload') return attachmentHint(context.dashcamStage, 'Dashcam_Files');
    if (context.endingStage === 'awaiting-face') return scanHint(context, 'dashcam', 'Dashcam_Files', context.dashcamLocation, 'ภาพจากกล้องหน้ารถ');
    if (context.documentsStage !== 'complete') return attachmentHint(context.documentsStage, 'Case_Documents');
    if (context.guidedPhase === 'review') return 'ตรวจคำตอบในช่องสนทนาของภัทรวัฒน์ แล้วกดกล่องส่งคำตอบได้เลยชูม';
    if (context.guidedPhase === 'ready') {
      const unavailable = folderHint('Case_Documents', context.caseDocumentsLocation);
      if (unavailable) return unavailable;
      if (context.evidenceMode === 'manual') {
        const files = context.guidedQuestionId === 'compare' ? 'เปิด krit_statement.txt กับ parking_access_log.txt ใน Case_Documents' : context.guidedQuestionId === 'timeline' ? 'เปิดเอกสารทั้งสามไฟล์ใน Case_Documents' : 'เปิด Case_Documents';
        return `${files} แล้วเลือกข้อความที่อยู่ในกรอบให้ครบตามคำถาม จากนั้นส่งคำตอบในสายนะชูม`;
      }
      if (context.evidenceMode === 'offer') return 'พิมพ์ “เอาสิ” ให้ฉันช่วยหา หรือ “เดี๋ยวหาเอง” เพื่อค้นจากเอกสารนะชูม';
      if (context.evidenceMode === 'assisting') return 'ฉันกำลังตรวจเอกสารอยู่ รอผลก่อนนะชูม';
      return 'กดกรอบคำถามของภัทรวัฒน์ในสายก่อน แล้วฉันจะถามว่าจะให้ช่วยตรวจเอกสารไหมนะชูม';
    }
    return 'รอภัทรวัฒน์ส่งคำถามหรือข้อมูลต่อไปในสายก่อนนะชูม';
  }

  if (context.reportStage === 'complete') return 'ส่งข้อมูลให้ภัทรวัฒน์แล้ว รอเขาติดต่อกลับมาอีกครั้งนะชูม';
  if (context.reportStage === 'awaiting-address') return context.reportSelection === 'address'
    ? 'เปิดแฟ้มบุคคลใน HumanDB แล้วคลิกที่อยู่ล่าสุดที่มีกรอบ เพื่อส่งให้ภัทรวัฒน์นะชูม'
    : 'กดคำขอที่อยู่ในสาย แล้วเปิดแฟ้มบุคคลใน HumanDB เพื่อส่งที่อยู่นะชูม';
  if (context.reportStage === 'awaiting-victim' && context.victimReplyReady) return 'เปิดสายของภัทรวัฒน์ แล้วกดตัวเลือกส่งชื่อผู้เสียชีวิตได้เลยชูม';
  if (context.reportStage === 'awaiting-victim') return scanHint(context, 'victim', 'Case_Files', context.caseFilesLocation, 'ภาพผู้เสียชีวิต');
  if (context.reportStage === 'awaiting-suspect') {
    if (context.reportSelection === 'name' && context.scanSubject === 'suspect' && context.scanStage === 'complete') return 'ค้นชื่อที่สแกนพบใน HumanDB แล้วคลิกชื่อในแฟ้มที่มีกรอบเพื่อส่งให้ภัทรวัฒน์นะชูม';
    if (context.scanSubject === 'suspect' && context.scanStage === 'complete') return 'กดคำถามของภัทรวัฒน์ในสาย แล้วค้นชื่อจากผลสแกนใน HumanDB เพื่อส่งเบาะแสนะชูม';
    return scanHint(context, 'suspect', 'Case_Files', context.caseFilesLocation, 'ภาพบุคคลก่อนเกิดเหตุ');
  }
  if (['victim-reply', 'name-reply', 'address-reply'].includes(context.reportStage)) return 'รอข้อความถัดไปจากภัทรวัฒน์ในสายนะชูม';
  if (context.attachmentStage && context.attachmentStage !== 'complete' && context.policeConversation === 'briefed') return attachmentHint(context.attachmentStage, 'Case_Files');
  return context.gameState === 'IDLE' ? 'รอสายจากเจ้าหน้าที่ก่อนนะชูม ระหว่างนี้คุยกับฉันหรือสำรวจเดสก์ท็อปได้เลย' : 'เปิดสายของภัทรวัฒน์ แล้วรอหรือตอบข้อความล่าสุดในสายก่อนนะชูม';
}
