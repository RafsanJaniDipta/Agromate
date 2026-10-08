export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: ApiErrorDetail[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}
