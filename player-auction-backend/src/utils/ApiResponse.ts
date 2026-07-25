export class ApiResponse<T = unknown> {
  public readonly success: true;
  public readonly message: string;
  public readonly data?: T;

  constructor(message: string, data?: T) {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}
