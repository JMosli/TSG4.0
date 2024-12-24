import { IsBase64, IsNotEmpty, IsString } from 'class-validator';

export class UploadPhotoDto {
  @IsBase64()
  @IsString()
  @IsNotEmpty()
  photo: string;

  @IsString()
  payment_uid: string;
}
