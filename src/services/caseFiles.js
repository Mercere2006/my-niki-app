export const caseFiles = [
  {
    name: 'cam_02_suspect.png', icon: '📷', type: 'ภาพบุคคลก่อนเกิดเหตุ', kind: 'cctv', subject: 'suspect', cameraId: 'CAM 02',
    simulatedThreat: false, imageUrl: '/cases/parking/cam_02_before_v2.png',
    description: 'ภาพจากกล้อง CAM 02 ก่อนเกิดเหตุ บุคคลอีกคนยืนอยู่ทางขวาของผู้เสียชีวิต ภาพใบหน้ามีคุณภาพต่ำ',
  },
  {
    name: 'cam_02_2214.png', icon: '📷', type: 'ภาพผู้เสียชีวิต', kind: 'cctv', subject: 'victim', cameraId: 'CAM 02',
    simulatedThreat: false, imageUrl: '/cases/parking/cam_02_scene_v2.png',
    description: 'ภาพจากกล้อง CAM 02 หลังเกิดเหตุ ลานจอดรถตึกอัยการ ผู้เสียชีวิตอยู่บริเวณเสาด้านซ้าย',
  },
  {
    name: 'incident_report.txt', icon: '📄', type: 'รายงานเหตุการณ์', kind: 'document',
    description: 'รายงานเหตุเอกสารสูญหายจากห้องเก็บหลักฐาน',
    content: `รายงานเหตุการณ์ // คดี CR-2026-014
สถานที่: ห้องเก็บหลักฐาน ตึกอัยการ
เหตุการณ์: เอกสารสำคัญสูญหายจากห้องเก็บหลักฐาน
เวลา 22:14 กล้อง CAM 02 บันทึกภาพบุคคลออกจากบริเวณห้องเก็บหลักฐาน
จากการตรวจกล้องที่โต๊ะทำงาน พบมือสวมถุงมือหยิบบัตรจากโต๊ะของธันวาเวลา 21:40 และนำบัตรมาวางคืนเวลา 06:35 ของเช้าวันถัดมา โดยกล้องไม่เห็นใบหน้า
ตำรวจต้องการตรวจว่าบุคคลในภาพ CAM 02 เป็นใคร และเกี่ยวข้องกับการใช้บัตรหรือไม่
หมายเหตุ: ภาพมีคุณภาพต่ำ ยังไม่สามารถระบุตัวบุคคลจากภาพเพียงอย่างเดียว`,
  },
  {
    name: 'access_log.txt', icon: '📋', type: 'บันทึกเข้าออก', kind: 'document',
    description: 'บันทึกการใช้บัตรเข้าออกบริเวณห้องเก็บหลักฐาน',
    content: `บันทึกระบบเข้าออก // ห้องเก็บหลักฐาน
เวลา 21:48 บัตร M-014 ลงทะเบียนเข้าอาคาร
เวลา 22:11 บัตร M-014 ถูกใช้เปิดประตูห้องเก็บหลักฐาน
เวลา 22:25 บัตร M-014 ลงทะเบียนออกจากอาคาร
ทะเบียนบัตร: M-014 ออกให้ธันวา วรากร
หมายเหตุ: ระบบบันทึกการใช้บัตร ไม่ได้ยืนยันว่าเจ้าของบัตรเป็นผู้ใช้`,
  },
  {
    name: 'witness_statement.txt', icon: '📝', type: 'คำให้การ', kind: 'document',
    description: 'คำให้การของธันวา วรากร เกี่ยวกับช่วงเวลาเกิดเหตุ',
    content: `บันทึกคำให้การ // ธันวา วรากร
ธันวาให้การว่า: "ผมออกจากอาคารตั้งแต่เวลา 21:30 น. และไม่ได้กลับเข้ามาอีก"
ธันวาให้การว่า: "ตอนออกจากอาคารผมคิดว่าบัตรอยู่กับตัว แต่เช้าวันถัดมาผมเจอบัตรวางอยู่บนโต๊ะ เลยคิดว่าคงทำตกหรือเผลอลืมไว้"
หมายเหตุ: ข้อความข้างต้นเป็นคำให้การ ยังไม่ได้ตรวจสอบความถูกต้อง`,
  },
];

// Both records are fictional; the camera result is revealed only after scanning.
export const cardHolderProfile = {
  imageUrl: '/cases/record-room/cardholder_thanwa.png',
  name: 'ธันวา วรากร', id: 'P-014', age: 38,
  occupation: 'เจ้าหน้าที่บำรุงรักษาอาคาร', status: 'เสียชีวิต',
};

export const cameraPerson = {
  imageUrl: '/cases/record-room/police_record_014.png',
  name: 'กฤตภาส นิลวัฒน์', id: 'P-027', age: 35,
  occupation: 'ผู้ช่วยอัยการ', status: 'บุคคลที่ต้องตรวจสอบ',
};

export function formatFileCount(files) {
  return `${files.length} ไฟล์`;
}
