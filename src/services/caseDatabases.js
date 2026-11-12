import { cardHolderProfile, cameraPerson } from './caseFiles.js';
import { dashcamPerson } from './caseEnding.js';

// Sample records for the fictional game world; they are not real databases.
export const people = [{
  ...cardHolderProfile,
  gender: 'ชาย',
  nationality: 'ไทย',
  eyeColor: 'น้ำตาล',
  height: '175 ซม.',
  dateOfBirth: '15 มีนาคม 2531',
  placeOfBirth: 'อำเภอเมือง จังหวัดศิรานคร',
  distinguishingMarks: 'ไม่มีข้อมูล',
  aliases: 'ไม่มีข้อมูล',
  bloodType: 'O+',
  maritalStatus: 'โสด',
  firearmLicense: 'ไม่มีข้อมูล',
  lastKnownAddress: 'เลขที่ 456 ถนนพหลโยธิน\nแขวงสามเสนใน เขตพญาไท กรุงเทพมหานคร 10400',
}, {
  ...cameraPerson,
  gender: 'ชาย', nationality: 'ไทย', eyeColor: 'น้ำตาล', height: '178 ซม.',
  dateOfBirth: '12 สิงหาคม 2534', placeOfBirth: 'อำเภอเมือง จังหวัดศิรานคร',
  distinguishingMarks: 'ไม่มีข้อมูล', aliases: 'ไม่มีข้อมูล', bloodType: 'B+',
  maritalStatus: 'โสด', firearmLicense: 'ไม่มีข้อมูล',
  lastKnownAddress: 'เลขที่ 88 ถนนแสงจันทร์\nแขวงศิรานคร เขตศิรานคร กรุงเทพมหานคร 10000',
}, {
  ...dashcamPerson,
  gender: 'ชาย', nationality: 'ไทย', eyeColor: 'น้ำตาล', height: '177 ซม.',
  dateOfBirth: '8 เมษายน 2533', placeOfBirth: 'กรุงเทพมหานคร',
  distinguishingMarks: 'ไม่มีข้อมูล', aliases: 'ไม่มีข้อมูล', bloodType: 'A+',
  maritalStatus: 'โสด', firearmLicense: 'ไม่มีข้อมูล',
  lastKnownAddress: 'ไม่มีข้อมูล',
}];

const normalizeName = (value) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('th');

export function findPersonByName(name) {
  const query = normalizeName(name);
  return query ? people.find((person) => normalizeName(person.name) === query) ?? null : null;
}

