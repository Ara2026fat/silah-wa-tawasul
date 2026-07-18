/** First character of a name for avatar circles, with a safe fallback for blank names. */
export function getInitial(name: string): string {
  return name.trim().charAt(0) || '؟';
}
