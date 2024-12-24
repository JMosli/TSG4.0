import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  crop: [number, number, number, number];

  @IsOptional()
  @IsNumber()
  scale: number;

  @IsOptional()
  @IsNumber()
  fps: number;

  @IsOptional()
  @IsNumber()
  targetWidth: number;

  @IsOptional()
  @IsNumber()
  skipNFrames: number;

  @IsOptional()
  @IsNumber()
  rotation: number;
}
