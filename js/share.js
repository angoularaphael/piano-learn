// Donner un fichier cree sur l'appareil : partage natif sur telephone, sinon telechargement.
export async function deliverFile(blob, filename, { share = false, title = '' } = {}) {
  const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
  if (share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}

// Le partage de fichiers est-il possible ici (surtout sur telephone) ?
export function canShareFiles(type = 'video/mp4') {
  try {
    return !!navigator.canShare?.({ files: [new File([new Blob([''], { type })], 'x', { type })] });
  } catch (e) {
    return false;
  }
}
