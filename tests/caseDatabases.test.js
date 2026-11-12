import test from 'node:test';
import assert from 'node:assert/strict';
import { findPersonByName } from '../src/services/caseDatabases.js';
import { cardHolderProfile, cameraPerson } from '../src/services/caseFiles.js';
import { dashcamFiles, dashcamPerson } from '../src/services/caseEnding.js';

test('HumanDB ค้นด้วยชื่อและนามสกุลของบุคคลสมมติ', () => {
  assert.equal(findPersonByName('  ธันวา   วรากร  ')?.name, 'ธันวา วรากร');
  assert.equal(findPersonByName(cameraPerson.name)?.id, cameraPerson.id);
  assert.notEqual(cameraPerson.id, cardHolderProfile.id);
  assert.notEqual(cameraPerson.imageUrl, cardHolderProfile.imageUrl);
  assert.match(findPersonByName('ธันวา วรากร').lastKnownAddress, /456 ถนนพหลโยธิน/);
  assert.equal(findPersonByName('ธันวา'), null);
  assert.equal(findPersonByName('ไม่มี บุคคลนี้'), null);
  assert.equal(findPersonByName(''), null);
});

test('แฟ้มอัศวกรใช้ภาพประจำตัวแยกจากหลักฐานกล้องหน้ารถและมีที่อยู่ในกรุงเทพมหานคร', () => {
  const person = findPersonByName('อัศวกร พรหมพิทักษ์');
  assert.ok(person);
  assert.equal(person.imageUrl, dashcamPerson.profileImageUrl);
  assert.notEqual(person.imageUrl, dashcamFiles[0].imageUrl);
  assert.match(person.lastKnownAddress, /กรุงเทพมหานคร/);
  assert.notEqual(person.lastKnownAddress, 'ไม่มีข้อมูล');
});

