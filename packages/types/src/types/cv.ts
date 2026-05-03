export enum CVVisibility {
  PRIVATE = "private",
  PUBLIC = "public",
  RECRUITERS_ONLY = "recruiters_only"
}

export interface CV {
  id: string;
  userId: string;
  fileUrl: string;
  visibility: CVVisibility;
  createdAt: Date;
  updatedAt: Date;
}
