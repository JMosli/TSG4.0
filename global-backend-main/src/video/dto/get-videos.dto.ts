import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { PaginateDto } from 'src/helpers/paginate/types';

export class GetVideosDto extends PaginateDto {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  range_id?: number;
}
