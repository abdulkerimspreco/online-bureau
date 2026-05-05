import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum SearchTagModeDto {
  ANY = 'ANY',
  ALL = 'ALL',
}

export class SearchCandidatesDto {
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

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsEnum(SearchTagModeDto)
  tagMode?: SearchTagModeDto = SearchTagModeDto.ANY;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page?: number = 1;
}
