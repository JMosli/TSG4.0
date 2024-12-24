import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRangeDto {
  @IsNotEmpty()
  @IsString()
  ip_address: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  owner_user_id: number;
}
