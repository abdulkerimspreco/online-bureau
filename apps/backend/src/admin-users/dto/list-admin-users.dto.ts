import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListAdminUsersDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsIn(['JOB_SEEKER', 'EMPLOYER', 'ADMIN'])
  role?: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
