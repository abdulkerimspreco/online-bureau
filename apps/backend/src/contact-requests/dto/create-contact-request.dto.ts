import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateContactRequestDto {
  @IsUUID()
  candidateId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
