/**
 * Operational error with an HTTP status and a stable machine-readable code the
 * mobile client can branch on (e.g. COMPETITION_FULL, ALREADY_REGISTERED).
 */
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(code, message, details) {
    return new AppError(400, code, message, details);
  }
  static unauthorized(message = 'Authentication required') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(403, 'FORBIDDEN', message);
  }
  static notFound(code = 'NOT_FOUND', message = 'Resource not found') {
    return new AppError(404, code, message);
  }
  static conflict(code, message, details) {
    return new AppError(409, code, message, details);
  }
}
