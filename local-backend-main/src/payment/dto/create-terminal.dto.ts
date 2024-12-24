import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateTerminalDto {
  @IsString()
  @IsNotEmpty()
  reader_id: string;

  @IsNumber()
  @IsNotEmpty()
  kiosk_id: number;
}
