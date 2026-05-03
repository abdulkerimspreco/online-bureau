import { IsEnum } from 'class-validator';
import { CVVisibility } from '@prisma/client';

export class UpdateCvVisibilityDto {
  @IsEnum(CVVisibility)
  visibility: CVVisibility;
}