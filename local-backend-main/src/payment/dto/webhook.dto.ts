import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

export class EventDto<Ev = string, T = object> {
  @IsString()
  @IsNotEmpty()
  type: Ev;

  @IsObject()
  data: T;
}

export class WebhookDto<Event extends EventDto = EventDto> {
  @IsObject()
  @IsNotEmpty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => EventDto)
  event: Event;

  @IsObject()
  @IsNotEmpty()
  @IsNotEmptyObject()
  _internal: object;
}
