import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { PaginateDto } from 'src/helpers/paginate/types';

export class GetUsersDto extends PaginateDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  owner_of?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  so_of?: number;
}
