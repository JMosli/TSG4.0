import { IsString } from 'class-validator';

export class BuyMediaDto {
  @IsString()
  token: string;

  @IsString()
  email: string;
}
