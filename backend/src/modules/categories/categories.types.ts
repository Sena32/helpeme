export interface CategorySummary {
  id: string;
  name: string;
}

export interface CategoryWithStatus extends CategorySummary {
  isActive: boolean;
}
