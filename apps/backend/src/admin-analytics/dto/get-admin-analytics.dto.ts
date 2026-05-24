import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class GetAdminAnalyticsDto {
  @IsOptional()
  @IsIn(['7', '30', '90', 'custom'])
  preset?: '7' | '30' | '90' | 'custom';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
