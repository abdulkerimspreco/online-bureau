import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  query?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsOptional()
  @IsUUID()
  tagId?: string;
}
