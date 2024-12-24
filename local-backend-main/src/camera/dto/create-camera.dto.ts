import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCameraDto {
  @IsNotEmpty()
  @IsString()
  ip_address: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  port: number;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  lane_name: string;

  @IsNotEmpty()
  @IsString()
  stream_url: string;

  @IsOptional()
  @IsNumber()
  kiosk_id: number = null;
}
