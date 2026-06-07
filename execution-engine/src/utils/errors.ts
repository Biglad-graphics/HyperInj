export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}
export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400); }
}
export class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409); }
}
