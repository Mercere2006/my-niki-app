export const initialAttachment = { stage: 'waiting', wasInfected: false };

// This is a fictional game sequence, not an antivirus scanner.
export function advanceAttachment(state, event) {
  const next = {
    waiting: { upload: 'uploading' },
    uploading: { uploaded: 'ready' },
    ready: { open: 'checking' },
    error: { open: 'checking' },
    checking: { loaded: 'scanning', 'load-failed': 'error' },
    scanning: { 'scan-clean': 'complete', 'scan-infected': 'cleaning' },
    cleaning: { cleaned: 'complete' },
  }[state.stage]?.[event];
  if (!next) return state;
  return { stage: next, wasInfected: state.wasInfected || event === 'scan-infected' };
}
