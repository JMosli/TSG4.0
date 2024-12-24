import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateStreamUrlDto {
  @IsString()
  @IsNotEmpty()
  stream_url: string;
}
