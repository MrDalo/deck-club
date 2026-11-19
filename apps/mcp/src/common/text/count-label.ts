/**
 * "1 card" or "N cards": how every count is written, in the AI's text and in
 * the views alike.
 * @param count - how many
 * @param singular - the word for one
 * @param plural - the word for several, `${singular}s` by default
 * @returns the label
 */
export function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
