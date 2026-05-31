import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const moderationOutcomes = ['DISMISS', 'ESCALATE'] as const;
export type ModerationOutcome = (typeof moderationOutcomes)[number];

export class ResolveCvModerationCaseDto {
  @IsIn(moderationOutcomes)
  action: ModerationOutcome;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
