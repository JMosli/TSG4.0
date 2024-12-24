import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { PaginateDto } from 'src/helpers/paginate/types';

export class GetAllRecordingsDto extends PaginateDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  manually_recorded: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  is_sold: boolean;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => +value)
  camera_id: number;
}
