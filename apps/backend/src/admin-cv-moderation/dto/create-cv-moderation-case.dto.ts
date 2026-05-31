import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCvModerationCaseDto {
  @IsUUID()
  candidateId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
