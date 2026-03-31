import {
  AUDIO_EXTENSIONS,
  AUDIO_MIME_PREFIXES,
  MIME_TYPE,
} from './tcx.constants';

export function formatFileSize(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function getMimeTypeFromKey(key: string) {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPE[ext] ?? 'application/octet-stream';
}

export function getFileExtension(filename: string) {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return '';
  }

  return filename.slice(lastDotIndex).toLowerCase();
}

export function isAudioFile(file: { fileName?: string; fileType?: string }) {
  const ext = getFileExtension(file.fileName ?? '');
  const isAudioExt = AUDIO_EXTENSIONS.includes(ext);
  const isAudioMime = AUDIO_MIME_PREFIXES.some((prefix) =>
    (file.fileType ?? '').startsWith(prefix),
  );

  return isAudioExt || isAudioMime;
}

export function validateJson(input: string) {
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid json structure');
    }

    return true;
  } catch {
    throw new Error('Invalid json structure');
  }
}

export function isValidFilename(filename?: string) {
  if (!filename) return false;
  if (filename.includes('\0')) return false;
  if (filename.length > 100) return false;
  if (filename.includes('..')) return false;
  if (filename.includes('/') || filename.includes('\\')) return false;
  if (/[<>:"|?*`~!]/.test(filename)) return false;

  const parts = filename.split('.');
  if (parts.length > 2) return false;

  const ext = parts.pop()?.toLowerCase() ?? '';
  return ['xlsx', 'zip'].includes(ext);
}
