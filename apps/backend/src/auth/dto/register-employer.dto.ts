import {
  Equals,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_MIN_LENGTH,
} from './password.constants';

export class RegisterEmployerDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message: PASSWORD_COMPLEXITY_MESSAGE,
  })
  password: string;

  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsString()
  industry: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsBoolean()
  @Equals(true, {
    message: 'You must accept the Terms of Service and Privacy Policy',
  })
  acceptedTermsAndPrivacy: boolean;
}
