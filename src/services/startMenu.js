const applications = [
  { id: 'terminal', label: 'Terminal', icon: '>_', group: 'System' },
  { id: 'human', label: 'HumanDB', icon: '🪪', group: 'Software' },
  { id: 'calculator', label: 'Calculator', icon: '🧮', group: 'System' },
  { id: 'notepad', label: 'Notepad', icon: '📝', group: 'System' },
  { id: 'trash', label: 'Trash', icon: '🗑️', group: 'System' },
];

export function getStartGroups(hasDownloadedCaseFiles, hasDocuments = false, hasDashcam = false) {
  const items = hasDownloadedCaseFiles
    ? [...applications, { id: 'case-files', label: 'Case_Files', icon: '📂', group: 'Files' }]
    : [...applications];
  if (hasDocuments) items.push({ id: 'case-documents', label: 'Case_Documents', icon: '📁', group: 'Files' });
  if (hasDashcam) items.push({ id: 'dashcam-files', label: 'Dashcam_Files', icon: '📁', group: 'Files' });
  return ['System', 'Software', 'Files']
    .map((label) => ({ label, items: items.filter((item) => item.group === label).sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' })) }))
    .filter((group) => group.items.length > 0);
}
