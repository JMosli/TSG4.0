import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ConnectCameraDto {
  @IsString()
  @IsNotEmpty()
  ip_address: string;

  @IsNumber()
  @IsNotEmpty()
  port: number;

  @IsString()
  @IsOptional()
  username: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsNumber()
  @IsOptional()
  kiosk_id: number = null;

  public isCredentialsProvided() {
    return !!this.password && !!this.username;
  }
}
