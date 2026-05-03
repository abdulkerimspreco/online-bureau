export type CvVisibility = 'PRIVATE' | 'PUBLIC' | 'COMPANY_ONLY';

export interface CV {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  visibility: CvVisibility;
  createdAt: string;
  updatedAt: string;
}
