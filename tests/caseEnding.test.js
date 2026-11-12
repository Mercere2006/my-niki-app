import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { followupQuestions } from '../src/services/caseFollowup.js';
import { advanceGuidedSequence } from '../src/services/guidedEvidence.js';
import { endingQueue, endingReply, advanceEnding, END_SCREEN_DELAY_MS } from '../src/services/caseEnding.js';
import { migrateFollowup } from '../src/services/migrateFollowup.js';
import { scheduleAtDeadline, readGameValue, writeGameValue } from '../src/services/gamePersistence.js';

describe('case ending', () => {
  it('finishes after the two remaining questions', () => {
    assert.deepEqual(advanceGuidedSequence({ index: 1, phase: 'review' }, 'continue', followupQuestions.length), { index: 1, phase: 'complete' });
    assert.equal(endingQueue[0].delayAfter, 3000);
    assert.equal(endingQueue.at(-1).after, 'dashcam');
  });
  it('requires the new evidence to be identified before closing the call', () => {
    let state = 'idle';
    for (const event of ['questions-complete', 'upload-complete', 'identified', 'send-name', 'call-ended', 'comfort']) state = advanceEnding(state, event);
    assert.equal(state, 'complete');
    assert.equal(advanceEnding('awaiting-face', 'send-name'), 'awaiting-face');
    assert.match(endingReply, /เขียนโปรแกรมสแกนใบหน้าให้แม่นยำขึ้น/);
  });
  it('shows the final screen five seconds after the reply, keeping the deadline after refresh', () => {
    assert.equal(END_SCREEN_DELAY_MS, 5000);
    const values = new Map();
    const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    writeGameValue('finalScreenDeadline', 10000 + END_SCREEN_DELAY_MS, storage);
    let now = 14000;
    let due = 0;
    let timer;
    const cancel = scheduleAtDeadline({ deadline: readGameValue('finalScreenDeadline', null, storage), onDue: () => due++, now: () => now, setTimer: (fn) => { timer = fn; return 1; }, clearTimer: () => {}, visibilityTarget: null, windowTarget: null });
    timer();
    assert.equal(due, 0);
    now = 15000;
    timer();
    assert.equal(due, 1);
    cancel();
  });
  it('migrates old saves without losing the current question or completed case', () => {
    const values = new Map();
    const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    const set = (key, value) => storage.setItem(`niki_game_v1:${key}`, JSON.stringify(value));
    const get = (key) => JSON.parse(storage.getItem(`niki_game_v1:${key}`));
    set('guidedSequence', { index: 1, phase: 'ready' });
    migrateFollowup(storage);
    assert.deepEqual(get('guidedSequence'), { index: 0, phase: 'ready' });
    migrateFollowup(storage);
    assert.deepEqual(get('guidedSequence'), { index: 0, phase: 'ready' });
    values.clear();
    set('guidedSequence', { index: 2, phase: 'complete' });
    set('followupPhase', 'active');
    migrateFollowup(storage);
    assert.equal(get('endingStage'), 'awaiting-upload');
    assert.equal(get('callQueue').at(-1).after, 'dashcam');
  });
});
