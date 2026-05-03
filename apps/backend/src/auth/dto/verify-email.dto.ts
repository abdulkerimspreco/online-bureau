import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(16)
  token: string;
}
