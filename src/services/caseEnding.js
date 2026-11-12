// This final investigation and its evidence are fictional game content.
export const dashcamFiles = [{
  name: 'dashcam_2214.png', icon: '📷', type: 'ภาพจากกล้องหน้ารถ',
  kind: 'cctv', subject: 'dashcam', imageUrl: '/cases/parking/dashcam_asawakon.png', simulatedThreat: false,
}];
export const dashcamPerson = {
  id: 'P-038', name: 'อัศวกร พรหมพิทักษ์', age: 36,
  occupation: 'ผู้ช่วยอัยการและเพื่อนร่วมงานของกฤตภาส',
  imageUrl: '/cases/parking/dashcam_asawakon.png',
};
export const endingQueue = [
  { text: 'แปปนะครับคุณเจ้าหน้าที่สายด่วน', delayAfter: 3000 },
  { text: 'ผมได้รับหลักฐานเพิ่มเติมมาจากกล้องหน้ารถคันหนึ่งที่จอดอยู่ตรงที่เกิดเหตุ' },
  { text: 'ไม่แน่บางทีกล้องนั้นอาจจะถ่ายติดหน้าคนร้ายก็ได้ครับ' },
  { text: 'ผมกำลังส่งภาพจากกล้องให้คุณนะ รบกวนคุณช่วยตรวจสอบทีว่านั่นใช่กฤตภาสไหม', after: 'dashcam' },
];
export const endingReply = 'ไม่เป็นไร NIKI ฉันว่าฉันต้องเขียนโปรแกรมสแกนใบหน้าให้แม่นยำขึ้นแล้วล่ะ';
export const END_SCREEN_DELAY_MS = 3000;
export function advanceEnding(stage, event) {
  return ({ idle: { 'questions-complete': 'awaiting-upload' }, 'awaiting-upload': { 'upload-complete': 'awaiting-face' }, 'awaiting-face': { identified: 'awaiting-name' }, 'awaiting-name': { 'send-name': 'closing' }, closing: { 'call-ended': 'apology' }, apology: { comfort: 'complete' } })[stage]?.[event] ?? stage;
}
