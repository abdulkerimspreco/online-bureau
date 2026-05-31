import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectCustomTagRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(140)
  note?: string;
}
