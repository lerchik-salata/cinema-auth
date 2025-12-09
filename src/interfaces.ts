import type { CoreUser, CoreCreateUserDto } from './types.ts';

export interface IUserRepository {
  findOneByEmail(email: string): Promise<CoreUser | null>;
  create(dto: CoreCreateUserDto, passwordHash: string): Promise<CoreUser>;
}

export interface IHashingService {
  hashPassword(password: string): Promise<string>;
  comparePasswords(password: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  signAsync(payload: any): Promise<string>;
}

export interface ILogger {
  error(message: string, context?: string): void;
  log(message: string, context?: string): void;
}