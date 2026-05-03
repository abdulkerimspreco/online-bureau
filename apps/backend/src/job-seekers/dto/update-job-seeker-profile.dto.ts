import { IsOptional, IsString } from 'class-validator';

export class UpdateJobSeekerProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  preferredJobCategories?: string;
}