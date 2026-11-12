import test from 'node:test';
import assert from 'node:assert/strict';
import { caseFiles, formatFileCount, cameraPerson, cardHolderProfile } from '../src/services/caseFiles.js';

test('บัตรเป็นของธันวาแต่บุคคลจากกล้องเป็นอีกคน และคำให้การสอดคล้องกับบัตรที่พบตอนเช้า', () => {
  const log = caseFiles.find((file) => file.name === 'access_log.txt').content;
  const statement = caseFiles.find((file) => file.name === 'witness_statement.txt').content;
  assert.match(log, new RegExp(cardHolderProfile.name));
  assert.match(statement, /21:30/);
  assert.match(statement, /เช้า/);
  assert.match(statement, /โต๊ะ/);
  assert.doesNotMatch(statement, /อยู่กับผมตลอดคืน/);
  assert.notEqual(cameraPerson.name, cardHolderProfile.name);
});

test('Case_Files มีภาพกล้องและเอกสารคดีที่เปิดอ่านได้', () => {
  assert.equal(caseFiles.filter((file) => file.kind === 'cctv').length, 2);
  assert.equal(caseFiles.filter((file) => file.kind === 'document' && file.content).length, 3);
  assert.equal(formatFileCount(caseFiles), '5 ไฟล์');
  assert.equal(formatFileCount([]), '0 ไฟล์');
});
