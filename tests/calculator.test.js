import test from 'node:test';
import assert from 'node:assert/strict';
import { initialCalculatorState, pressCalculatorKey } from '../src/services/calculator.js';

const run = (keys) => keys.reduce(pressCalculatorKey, initialCalculatorState);

test('คำนวณพื้นฐานและคำนวณต่อเนื่องได้', () => {
  assert.equal(run(['1', '2', '+', '7', '=']).display, '19');
  assert.equal(run(['9', '−', '3', '×', '2', '=']).display, '12');
  assert.equal(run(['8', '÷', '2', '=', '=']).display, '2');
});

test('รองรับทศนิยม แก้เลข ล้างค่า และหารด้วยศูนย์', () => {
  assert.equal(run(['0', '.', '1', '+', '0', '.', '2', '=']).display, '0.3');
  assert.equal(run(['1', '2', '⌫']).display, '1');
  assert.equal(run(['1', '2', 'C']).display, '0');
  assert.equal(run(['9', '÷', '0', '=']).display, 'ไม่สามารถหารด้วยศูนย์');
  assert.equal(run(['9', '÷', '0', '=', '3']).display, '3');
});
