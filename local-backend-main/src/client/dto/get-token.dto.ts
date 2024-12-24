import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetMediaTokenDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => +value)
  video_id?: number;

  @IsString()
  @IsOptional()
  frame?: string;
}
