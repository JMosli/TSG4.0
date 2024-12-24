import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateCheckoutLinkDto {
  @IsInt()
  @IsPositive()
  @Min(+process.env.BASE_VIDEO_PRICE)
  price: number;

  @IsString()
  @IsNotEmpty()
  session_uid: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  reader_id?: string;
}
