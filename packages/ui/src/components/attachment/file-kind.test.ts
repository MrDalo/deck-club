import { describe, expect, it } from 'vitest';
import { fileKindOf } from './file-kind';

describe('fileKindOf', () => {
  it.each([
    ['cell.png', 'image/png', 'image'],
    ['deck.csv', 'text/csv', 'spreadsheet'],
    ['deck.apkg', 'application/octet-stream', 'archive'],
    ['notes.pdf', 'application/pdf', 'document'],
    ['lecture.mp3', 'audio/mpeg', 'audio'],
    ['lab.webm', 'video/webm', 'video'],
    [
      'cards.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'spreadsheet',
    ],
  ])('%s (%s) is %s', (name, type, kind) => {
    expect(fileKindOf(name, type)).toBe(kind);
  });

  it('falls back to the extension when the type is missing or generic', () => {
    expect(fileKindOf('Biology.APKG')).toBe('archive');
    expect(fileKindOf('photo.JPG', '')).toBe('image');
  });

  it('answers file for anything else', () => {
    expect(fileKindOf('README')).toBe('file');
    expect(fileKindOf('data.bin', 'application/octet-stream')).toBe('file');
  });
});
