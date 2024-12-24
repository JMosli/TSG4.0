import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRangeDto {
  @IsString()
  @IsNotEmpty()
  private_key_signer: string;

  @IsString()
  @IsNotEmpty()
  public_key_checker: string;

  @IsNumber()
  @IsNotEmpty()
  range_id: number;
}
