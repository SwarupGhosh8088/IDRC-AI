export class ApiError extends Error {
  constructor(status, message, code = 'INTERNAL_ERROR', errors = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.success = false;
  }
}
