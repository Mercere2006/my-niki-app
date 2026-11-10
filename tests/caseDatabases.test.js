import test from 'node:test';
import assert from 'node:assert/strict';
import { findPersonByName } from '../src/services/caseDatabases.js';
import { cardHolderProfile, cameraPerson } from '../src/services/caseFiles.js';

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

