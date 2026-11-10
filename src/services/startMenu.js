const applications = [
  { id: 'terminal', label: 'Terminal', icon: '>_', group: 'System' },
  { id: 'human', label: 'HumanDB', icon: '🪪', group: 'Software' },
  { id: 'calculator', label: 'Calculator', icon: '🧮', group: 'System' },
  { id: 'notepad', label: 'Notepad', icon: '📝', group: 'System' },
];

export function getStartGroups(hasDownloadedCaseFiles) {
  const items = hasDownloadedCaseFiles
    ? [...applications, { id: 'case-files', label: 'Case_Files', icon: '📂', group: 'Files' }]
    : [...applications];
  return ['System', 'Software', 'Files']
    .map((label) => ({ label, items: items.filter((item) => item.group === label).sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' })) }))
    .filter((group) => group.items.length > 0);
}
