export type Rank = 'Initiate' | 'Keeper' | 'Silent One' | 'Unseen';

export function getRank(days: number): Rank {
  if (days >= 90) return 'Unseen';
  if (days >= 30) return 'Silent One';
  if (days >= 7) return 'Keeper';
  return 'Initiate';
}

export function getMultiplier(days: number): number {
  if (days >= 90) return 500;
  if (days >= 30) return 250;
  if (days >= 7) return 150;
  return 100;
}