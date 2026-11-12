import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FOLLOWUP_DELAY_MS, INTERTITLE_MS, followupFiles, followupIntroduction, followupQuestions, followupAcknowledgements, formatTimelineReply, nextFollowupPhase } from '../src/services/caseFollowup.js';
import { advanceGuidedSequence, getMissingGuidedFiles, initialGuidedSequence } from '../src/services/guidedEvidence.js';
import { getOpenedEvidence } from '../src/services/evidenceAnalysis.js';
import { askEvidenceBrainResult, askTimelineBrain } from '../src/services/capriBrain.js';

describe('second call', () => {
  it('moves through the timed transition only in order', () => {
    assert.equal(FOLLOWUP_DELAY_MS, 5000);
    assert.ok(INTERTITLE_MS > 0);
    assert.equal(nextFollowupPhase('pending', 'elapsed'), 'intertitle');
    assert.equal(nextFollowupPhase('intertitle', 'elapsed'), 'ringing');
    assert.equal(nextFollowupPhase('ringing', 'answer'), 'active');
    assert.equal(nextFollowupPhase('pending', 'answer'), 'pending');
  });
  it('provides the required shooting-case evidence in sequence', () => {
    assert.equal(followupIntroduction.at(-1), 'ผมกำลังส่งเอกสารให้ รบกวนคุณช่วยตรวจสอบแล้วเรียงเหตุการณ์ให้ที');
    assert.deepEqual(followupQuestions.map((question) => question.id), ['compare', 'timeline']);
    const names = followupFiles.map((file) => file.name);
    for (const question of followupQuestions) {
      assert.ok(question.requiredFiles.every((name) => names.includes(name)));
      assert.deepEqual(getMissingGuidedFiles(question, names), []);
    }
    assert.match(followupFiles.map((file) => file.content).join('\n'), /กฤตภาส/);
    const statement = followupFiles.find((file) => file.name === 'krit_statement.txt');
    assert.match(statement.content, /เขาเองก็ไม่ได้รู้จักกับนายธันวา วรากรเป็นการส่วนตัว/);
    assert.equal(followupQuestions[1].mode, 'timeline');
    assert.equal(followupAcknowledgements.length, followupQuestions.length);
    let state = advanceGuidedSequence(initialGuidedSequence, 'delivered');
    state = advanceGuidedSequence(state, 'delivered');
    assert.equal(state.phase, 'ready');
    state = advanceGuidedSequence(state, 'success');
    assert.equal(state.phase, 'review');
    state = advanceGuidedSequence(state, 'continue');
    assert.deepEqual(state, { index: 1, phase: 'pending' });
  });
  it('analyzes the new evidence and validates timeline citations', async () => {
    const oldFetch = globalThis.fetch;
    const config = { provider: 'gemini', model: 'gemini-test', apiKey: 'test-key' };
    const files = getOpenedEvidence(followupFiles, followupFiles.map((file) => file.name));
    let requests = [];
    globalThis.fetch = async (_url, options) => {
      requests.push(JSON.parse(options.body));
      const result = requests.length === 1
        ? { answer: 'มีการใช้บัตรหลังเวลาที่กฤตภาสบอกว่าออกจากตึก แต่ยังระบุผู้ใช้ไม่ได้', citations: [
          { file: 'krit_statement.txt', quote: 'ออกจากอาคารเวลา 21:54 น.' },
          { file: 'parking_access_log.txt', quote: '22:11 น. บัตร K-027 ถูกใช้ที่ประตูทางเข้าลานจอดรถ' },
        ] }
        : { events: [
          { day: 'incident', time: '22:14', description: 'เกิดเหตุยิง', file: 'parking_incident_report.txt', quote: '22:14 น. กล้องบันทึกเหตุยิง' },
          { day: 'incident', time: '22:11', description: 'บัตรถูกใช้', file: 'parking_access_log.txt', quote: '22:11 น. บัตร K-027 ถูกใช้ที่ประตูทางเข้าลานจอดรถ' },
        ] };
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }] }) };
    };
    try {
      const compared = files.filter((file) => followupQuestions[0].requiredFiles.includes(file.name));
      const answer = await askEvidenceBrainResult({ question: followupQuestions[0].question, files: compared, config });
      assert.equal(answer.ok, true);
      assert.match(answer.message, /parking_access_log.txt/);
      assert.doesNotMatch(JSON.stringify(requests[0]), /parking_incident_report.txt/);
      const timeline = await askTimelineBrain({ files, config });
      assert.equal(timeline.ok, true);
      assert.deepEqual(timeline.events.map((event) => event.time), ['22:11', '22:14']);
      assert.equal(formatTimelineReply(timeline.events), '22:11 น. บัตรถูกใช้\n22:14 น. เกิดเหตุยิง');
      assert.match(JSON.stringify(requests[1]), /parking_incident_report.txt/);
    } finally {
      globalThis.fetch = oldFetch;
    }
  });
});
