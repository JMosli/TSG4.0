import { IsNumber } from 'class-validator';

export class AddPollAnswerDto {
  @IsNumber()
  question: number;

  @IsNumber()
  answer: number;

  @IsNumber()
  client_id: number
}
