import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateEmployerProfileDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    companyName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsUrl({}, { message: 'Website must be a valid URL' })
    website?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    industry?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    companySize?: string;
}