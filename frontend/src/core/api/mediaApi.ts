import { apiClient } from './api-client';

export interface MediaUploadResult {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

export const mediaApi = {
  /**
   * Uploads an image or document file to the backend /api/media/upload endpoint.
   * Supports: .jpg, .jpeg, .png, .webp, .pdf (up to 25MB).
   */
  async uploadFile(file: File): Promise<MediaUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post<MediaUploadResult>('/api/media/upload', formData);
  },
};
