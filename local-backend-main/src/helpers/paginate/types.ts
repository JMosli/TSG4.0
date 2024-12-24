import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class PaginateDto {
  @Type(() => Number)
  @IsNotEmpty()
  @IsPositive()
  @IsNumber()
  take: number;

  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  skip: number;
}

export interface QueryWithPagination {
  skip: number;
  take: number;
  searchQuery?: string;
}

export enum PaginateErrors {
  NoTake = 'no_take',
  SizeExceeded = 'size_exceeded',
}
