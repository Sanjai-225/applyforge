export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function unauthorized(msg = "Unauthorized"): AppError {
  return new AppError(msg, 401, "UNAUTHORIZED");
}

export function forbidden(msg = "Forbidden"): AppError {
  return new AppError(msg, 403, "FORBIDDEN");
}

export function notFound(msg = "Not found"): AppError {
  return new AppError(msg, 404, "NOT_FOUND");
}

export function badRequest(msg = "Bad request"): AppError {
  return new AppError(msg, 400, "BAD_REQUEST");
}
