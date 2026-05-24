export interface Tag {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminTag extends Tag {
  cvCount: number;
  savedSearchCount: number;
}
