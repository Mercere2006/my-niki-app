import { readGameValue, writeGameValue } from './gamePersistence.js';
import { followupQuestions } from './caseFollowup.js';
import { endingQueue } from './caseEnding.js';

// Older saves used three questions. Keep the player's place when the first is removed.
export function migrateFollowup(storage) {
  if (readGameValue('followupQuestionsVersion', 0, storage) >= 2) return;
  const state = readGameValue('guidedSequence', null, storage);
  if (state && state.index >= 0) {
    const queue = readGameValue('callQueue', [], storage);
    if (state.index === 0 && state.phase !== 'complete') {
      const oldQuestion = 'ในคำให้การ กฤตภาสบอกว่าออกจากตึกเวลาใด';
      const replacement = followupQuestions[0];
      const replace = (entry) => (entry.text?.includes(oldQuestion) || entry.raw?.includes(oldQuestion))
        ? { ...entry, text: replacement.question, raw: replacement.line } : entry;
      writeGameValue('callMessages', readGameValue('callMessages', [], storage).map(replace), storage);
      writeGameValue('callQueue', queue.map(replace), storage);
      writeGameValue('guidedSequence', { index: 0, phase: state.phase === 'pending' ? 'pending' : 'ready' }, storage);
      writeGameValue('evidenceMode', 'idle', storage);
      writeGameValue('selectedEvidenceIds', [], storage);
      writeGameValue('guidedEvidenceAnswer', '', storage);
      writeGameValue('guidedEvidenceResponse', '', storage);
      writeGameValue('guidedEvidenceVisible', false, storage);
      writeGameValue('capriMessage', 'ภัทรวัฒน์มีคำถามเกี่ยวกับเอกสาร กดคำถามในสายได้เลยนะชูม', storage);
      writeGameValue('lastPlayerInput', '', storage);
    } else {
      writeGameValue('guidedSequence', { ...state, index: Math.max(0, state.index - 1) }, storage);
      if (state.phase === 'complete' && readGameValue('followupPhase', '', storage) === 'active') {
        writeGameValue('endingStage', 'awaiting-upload', storage);
        writeGameValue('callQueue', [...queue, ...endingQueue], storage);
      }
    }
  }
  writeGameValue('followupQuestionsVersion', 2, storage);
}
