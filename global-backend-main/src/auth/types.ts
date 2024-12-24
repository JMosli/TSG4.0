import { User } from '@prisma/client';

export enum AuthErrors {
  UserAlreadyExists = 'already_exists',
  NotFound = 'not_found',
  WrongToken = 'verify_error',
  NoToken = 'no_token_provided',
}

export type UserContext = Omit<User, 'password'>;
