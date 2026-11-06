export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
  get isValidation() { return this.status === 422 && !!this.fields; }
  get isNetwork() { return this.status === 0; }
}

/** Human message for any thrown value (never leaks internals). */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return 'Something went wrong. Please try again.';
}
