import { IsString, Length } from 'class-validator';

export class CreateShortlistFolderDto {
  @IsString()
  @Length(1, 60)
  name: string;
}
