export enum Priority {
  High = 'HIGH',
  Medium = 'MEDIUM',
  Low = 'LOW',
}

export const UNSET_PRIORITY_RANK = 0;

// Numeric rank lets Mongo sort by priority correctly (ADR-4).
export const PRIORITY_RANK: Record<Priority, number> = {
  [Priority.High]: 3,
  [Priority.Medium]: 2,
  [Priority.Low]: 1,
};
