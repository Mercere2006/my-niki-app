// A short cue accompanies guidance; playback failures must not interrupt the game.
export function playNikiGuidanceSound({ muted = false, createAudio = () => new Audio('/audio/niki-guide.wav') } = {}) {
  if (muted) return () => {};
  let audio;
  try {
    audio = createAudio();
    audio.volume = 0.32;
    audio.loop = false;
    Promise.resolve(audio.play()).catch(() => {});
  } catch {
    return () => {};
  }
  return () => audio.pause();
}
