import { formatTimelineReply } from './caseFollowup.js';
import { getManualEvidence, getManualEvidenceResult } from './evidenceInteraction.js';

// Use the case's cited excerpts as a playable fallback if the AI is unavailable.
export function buildGuidedAnswerFile(question, result) {
  const evidence = getManualEvidence(question.id);
  const fallback = getManualEvidenceResult(question.id, evidence.map((item) => item.id));
  const isTimeline = question.mode === 'timeline';
  const answer = result.ok ? (isTimeline ? formatTimelineReply(result.events) : result.answer) : fallback.answer;
  const sources = result.ok
    ? (isTimeline ? result.events.map((event) => `• ${event.file}: “${event.quote}”`).join('\n') : (result.message.split('\n\nอ้างอิง:\n')[1] ?? result.message))
    : evidence.map((item) => `• ${item.file}: “${item.quote}”`).join('\n');
  return {
    name: `NIKI_คำตอบ_${question.id}.txt`,
    kind: 'guided-answer',
    questionId: question.id,
    question: question.question,
    answer,
    content: `${result.ok ? 'ผลวิเคราะห์ของ NIKI' : 'AI ไม่พร้อมใช้งาน: แสดงข้อมูลที่เตรียมไว้จากเอกสารคดี'}\n\nอ้างอิง:\n${sources}`,
  };
}
