export const DESKTOP_FOLDER_DRAG = 'application/x-niki-desktop-folder';
export const TRASH_FOLDER_DRAG = 'application/x-niki-trash-folder';

export const desktopFolders = [
  { id: 'Case_Files', icon: '📂' },
  { id: 'Case_Documents', icon: '📁' },
  { id: 'Dashcam_Files', icon: '📁' },
];

export function folderLocation(state, id) {
  return ['trash', 'deleted'].includes(state?.[id]) ? state[id] : 'desktop';
}

function transition(state, id, from, to) {
  if (!desktopFolders.some((folder) => folder.id === id) || folderLocation(state, id) !== from) return state;
  const next = { ...state };
  if (to === 'desktop') delete next[id];
  else next[id] = to;
  return next;
}

export const moveFolderToTrash = (state, id) => transition(state, id, 'desktop', 'trash');
export const restoreFolder = (state, id) => transition(state, id, 'trash', 'desktop');
export const deleteFolderPermanently = (state, id) => transition(state, id, 'trash', 'deleted');
