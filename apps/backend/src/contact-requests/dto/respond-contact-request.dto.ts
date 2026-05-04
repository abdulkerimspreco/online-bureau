import { IsEnum } from 'class-validator';

export enum ContactRequestDecision {
  ACCEPT = 'ACCEPT',
  DECLINE = 'DECLINE',
}

export class RespondContactRequestDto {
  @IsEnum(ContactRequestDecision)
  action!: ContactRequestDecision;
}
