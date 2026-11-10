export function resizeWindow({ width, height, deltaX, deltaY, maxWidth, maxHeight }) {
  return {
    width: Math.min(maxWidth, Math.max(Math.min(320, maxWidth), width + deltaX)),
    height: Math.min(maxHeight, Math.max(Math.min(240, maxHeight), height + deltaY)),
  };
}

export function moveWindow({ rect, deltaX, deltaY, viewportWidth, viewportHeight }) {
  return {
    left: Math.max(0, Math.min(Math.max(0, viewportWidth - rect.width), rect.left + deltaX)),
    top: Math.max(32, Math.min(Math.max(32, viewportHeight - 44 - rect.height), rect.top + deltaY)),
  };
}
