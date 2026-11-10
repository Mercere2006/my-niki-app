// The reconstruction is a scripted investigation sequence for this fictional case.
export function nextFaceScanStage(stage, event) {
  if (stage === 'idle' && event === 'start') return 'scanning';
  if (stage === 'scanning' && event === 'finished') return 'low-quality';
  if (stage === 'low-quality' && event === 'finished') return 'analyzing';
  if (stage === 'analyzing' && event === 'finished') return 'complete';
  return stage;
}

export function lowQualityMessage(origin) {
  return origin === 'manual'
    ? 'ดูเหมือนภาพจะมีคุณภาพต่ำเกินไปจนคุณสแกนเองไม่ได้ ให้ฉันช่วยวิเคราะห์ด้วยการวิเคราะห์ขั้นสูงนะ'
    : 'ภาพจากกล้องมีคุณภาพต่ำเกินไป เดี๋ยวฉันจะลองเปลี่ยนไปใช้การวิเคราะห์ขั้นสูงแทนนะชูม';
}
