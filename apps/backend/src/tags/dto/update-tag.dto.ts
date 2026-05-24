import { IsString, Length } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @Length(1, 50)
  name!: string;
}
