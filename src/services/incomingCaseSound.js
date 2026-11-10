export function playIncomingCaseSound({ muted = false, playVoice, createAudio = () => new Audio('/capri/voice/case-alert.wav') }) {
  if (muted) return () => {};

  let audio;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    playVoice();
  };

  try {
    audio = createAudio();
    audio.volume = 0.55;
    audio.onended = finish;
    audio.onerror = finish;
    Promise.resolve(audio.play()).catch(finish);
  } catch {
    finish();
  }

  return () => {
    finished = true;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    }
  };
}
