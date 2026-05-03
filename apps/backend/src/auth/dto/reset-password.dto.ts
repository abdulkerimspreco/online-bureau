import { IsString, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_MIN_LENGTH,
} from './password.constants';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message: PASSWORD_COMPLEXITY_MESSAGE,
  })
  password: string;
}
