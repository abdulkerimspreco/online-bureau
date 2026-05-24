import { IsString, MinLength } from 'class-validator';
import {
  PASSWORD_MIN_LENGTH,
} from './password.constants';

export class DeleteAccountDto {
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  })
  password: string;
}
