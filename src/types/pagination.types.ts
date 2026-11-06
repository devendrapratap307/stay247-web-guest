export interface PageParams { limit?: number; cursor?: number; [k: string]: string | number | undefined }
export interface Page<T> { items: T[]; nextCursor: number }
