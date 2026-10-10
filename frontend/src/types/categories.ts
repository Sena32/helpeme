export interface Category {
  id: string;
  name: string;
}

export interface CategoryWithStatus extends Category {
  isActive: boolean;
}
