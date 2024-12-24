import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class UploadVideoDto {
  @IsString()
  @IsNotEmpty()
  payment_uid: string;

  @IsNumber()
  @IsNotEmpty()
  local_id: number;
}
