import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PhotoDefinition {
  @IsNumber()
  timestamp: number;

  @IsNumber()
  client_id: number;
}

export class CreateSessionDto {
  @IsString()
  email: string;

  @IsNumber({}, { each: true })
  client_ids: number[];

  @IsOptional()
  @IsNumber({}, { each: true })
  video_ids: number[] = [];

  @IsOptional()
  @Type(() => PhotoDefinition)
  @ValidateNested({ each: true })
  @IsArray()
  photos: PhotoDefinition[] = [];
}
