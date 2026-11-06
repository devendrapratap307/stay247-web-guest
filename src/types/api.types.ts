export interface Envelope<T> { data: T; meta?: { next_cursor: number; limit: number } }
export interface ApiErrorBody { error: { code: string; message: string; fields?: Record<string, string> } }
