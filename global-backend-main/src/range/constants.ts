import type { Range } from '@prisma/client';

export enum RangeErrors {
  UserNotFound = 'user_not_found',
  RangeUnavailable = 'range_is_unavailable',
  RangeNotFound = 'range_not_found',
  WrongPath = 'wrong_path',
  CannotRemoveYourself = 'cannot_remove_yourself',
  RangeCreationError = 'range_creation_error',
}

export type RangeContext = Range;
