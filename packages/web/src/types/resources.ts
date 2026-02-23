export interface ProgramResource {
  id: string;
  programId: string;
  lessonId: string | null;
  name: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  category: string;
  externalUrl: string | null;
  url: string | null;
  order: number;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
