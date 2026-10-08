export type Rank = 'Initiate' | 'Keeper' | 'Silent One' | 'Unseen';

export function getRank(days: number): Rank {
  if (days >= 60) return 'Unseen';
  if (days >= 30) return 'Silent One';
  if (days >= 7) return 'Keeper';
  return 'Initiate';
}

export function getMultiplier(days: number): number {
  if (days >= 60) return 7500;
  if (days >= 30) return 5000;
  if (days >= 7) return 2000;
  return 500;
}