export type Envelope<T> = {
  data: T;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: {
    total: number;
    page?: number;
    limit?: number;
  };
};
