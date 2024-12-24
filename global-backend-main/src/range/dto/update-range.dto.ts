import {
  Transform,
  TransformInstanceToInstance,
  Type,
} from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class RangeUserConnectDto {
  @IsOptional()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  connect?: number[];

  @IsOptional()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  disconnect?: number[];
}

export class UpdateRangeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @ValidateNested()
  @IsObject()
  @Type(() => RangeUserConnectDto)
  owners?: RangeUserConnectDto;

  @IsOptional()
  @ValidateNested()
  @IsObject()
  @Type(() => RangeUserConnectDto)
  security_guards?: RangeUserConnectDto;
}
