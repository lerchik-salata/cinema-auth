export class ConflictError extends Error {
  public status = 409;

  constructor(message: string = "The user already exists") {
    super(message);
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends Error {
  public status = 401;

  constructor(message: string = "Incorrect email or password") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
