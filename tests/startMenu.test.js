import test from 'node:test';
import assert from 'node:assert/strict';
import { getStartGroups } from '../src/services/startMenu.js';

test('เมนูแยกหมวดเรียงตามตัวอักษรและเพิ่ม Files หลังดาวน์โหลด', () => {
  const before = getStartGroups(false);
  assert.deepEqual(before.map((group) => group.label), ['System', 'Software']);
  assert.deepEqual(before[0].items.map((app) => app.label), ['Calculator', 'Notepad', 'Terminal', 'Trash']);
  assert.deepEqual(before[1].items.map((app) => app.label), ['HumanDB']);
  const after = getStartGroups(true);
  assert.deepEqual(after.map((group) => group.label), ['System', 'Software', 'Files']);
  assert.deepEqual(after[2].items.map((app) => app.label), ['Case_Files']);
  const withDocuments = getStartGroups(true, true);
  assert.deepEqual(withDocuments[2].items.map((app) => app.label), ['Case_Documents', 'Case_Files']);
});
