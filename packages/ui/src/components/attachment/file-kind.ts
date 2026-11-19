/** What a file is, as far as its icon and colour are concerned. */
export type FileKind =
  'image' | 'spreadsheet' | 'archive' | 'document' | 'audio' | 'video' | 'file';

const EXTENSIONS: Record<Exclude<FileKind, 'file'>, readonly string[]> = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'heic'],
  spreadsheet: ['csv', 'tsv', 'xlsx', 'xls', 'ods'],
  // .apkg is an Anki deck: a zip archive.
  archive: ['zip', 'apkg', 'gz', 'tar', '7z', 'rar'],
  document: ['pdf', 'txt', 'md', 'json', 'doc', 'docx', 'odt', 'rtf'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
  video: ['mp4', 'webm', 'mov', 'mkv'],
};

function kindOfMimeType(mimeType: string): FileKind | undefined {
  const type = mimeType.toLowerCase();
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('audio/')) return 'audio';
  if (type.startsWith('video/')) return 'video';
  if (type.includes('csv') || type.includes('spreadsheet') || type.includes('excel'))
    return 'spreadsheet';
  if (type.includes('zip') || type.includes('compressed') || type.includes('tar')) return 'archive';
  if (
    type.startsWith('text/') ||
    type.includes('pdf') ||
    type.includes('json') ||
    type.includes('word')
  )
    return 'document';
  return undefined;
}

/**
 * The kind of a file, from its MIME type when it is specific and from its
 * extension otherwise (browsers often report "" or octet-stream).
 * @param name - the file name, with its extension
 * @param mimeType - the MIME type, if known
 * @returns the file kind; `file` when nothing matches
 */
export function fileKindOf(name: string, mimeType?: string): FileKind {
  const fromType = mimeType === undefined ? undefined : kindOfMimeType(mimeType);
  if (fromType !== undefined) return fromType;
  const extension = name.includes('.') ? (name.split('.').at(-1)?.toLowerCase() ?? '') : '';
  const match = Object.entries(EXTENSIONS).find(([, extensions]) => extensions.includes(extension));
  return (match?.[0] as FileKind | undefined) ?? 'file';
}
