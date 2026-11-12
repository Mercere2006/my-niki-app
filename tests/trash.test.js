import test from 'node:test';
import assert from 'node:assert/strict';
import { folderLocation, moveFolderToTrash, restoreFolder, deleteFolderPermanently } from '../src/services/trash.js';
import { readGameValue, writeGameValue } from '../src/services/gamePersistence.js';

test('ย้ายโฟลเดอร์ลงถังและกู้คืนโดยเก็บสถานะหลังรีเฟรช', () => {
  const values = new Map();
  const storage = { setItem: (key, value) => values.set(key, value), getItem: (key) => values.get(key) ?? null };
  let state = moveFolderToTrash({}, 'Case_Files');
  assert.equal(folderLocation(state, 'Case_Files'), 'trash');
  assert.equal(folderLocation(state, 'Case_Documents'), 'desktop');
  writeGameValue('folderLocations', state, storage);
  state = readGameValue('folderLocations', {}, storage);
  state = restoreFolder(state, 'Case_Files');
  assert.equal(folderLocation(state, 'Case_Files'), 'desktop');
});

test('ลบถาวรได้เฉพาะรายการในถังและกู้คืนไม่ได้', () => {
  let state = deleteFolderPermanently({}, 'Case_Documents');
  assert.equal(folderLocation(state, 'Case_Documents'), 'desktop');
  state = moveFolderToTrash(state, 'Case_Documents');
  state = deleteFolderPermanently(state, 'Case_Documents');
  assert.equal(folderLocation(state, 'Case_Documents'), 'deleted');
  assert.equal(folderLocation(restoreFolder(state, 'Case_Documents'), 'Case_Documents'), 'deleted');
  assert.equal(folderLocation(moveFolderToTrash(state, 'Case_Documents'), 'Case_Documents'), 'deleted');
});

test('ไม่สามารถสร้างรายการปลอมหรือลบแอประบบผ่านถังขยะ', () => {
  assert.deepEqual(moveFolderToTrash({}, 'Terminal'), {});
  assert.deepEqual(restoreFolder({}, 'other'), {});
});
