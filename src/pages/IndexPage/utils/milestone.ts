export function getMilestoneMessage(days: number): string | null {
  if (days === 7) return 'You are now a Keeper. The silence deepens.';
  if (days === 30) return 'You are now a Silent One. They have noticed.';
  if (days === 90) return 'You are now Unseen. You were never here.';
  if (days === 365) return 'One year. You are a myth now.';
  return null;
}