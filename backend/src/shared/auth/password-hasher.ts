import bcrypt from "bcrypt";

export interface PasswordHasher {
  hash(value: string): Promise<string>;
}

export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly saltRounds = 10) {}

  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.saltRounds);
  }
}