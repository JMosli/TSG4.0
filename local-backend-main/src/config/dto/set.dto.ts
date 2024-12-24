import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SetValueDto {
  @IsString()
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsBoolean()
  must_reboot: boolean = false;
}
