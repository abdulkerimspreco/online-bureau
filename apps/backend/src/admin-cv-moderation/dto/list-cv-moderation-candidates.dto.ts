import { IsOptional, IsString } from 'class-validator';

export class ListCvModerationCandidatesDto {
  @IsOptional()
  @IsString()
  query?: string;
}
