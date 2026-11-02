export type UUID = string;

export interface EntityTimestamps {
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface QueryFilter {
  search?: string;
  date?: string;
  status?: string;
}
