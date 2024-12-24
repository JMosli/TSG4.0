import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class StatisticsQueryDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  range_id: number;
}

export class DateQueryDto extends StatisticsQueryDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  start_date: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  end_date: number;
}
