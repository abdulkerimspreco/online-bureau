import { IsIn } from 'class-validator';

export const moderationDecisions = ['CONSENT', 'DECLINE'] as const;
export type ModerationDecision = (typeof moderationDecisions)[number];

export class RespondCvModerationCaseDto {
  @IsIn(moderationDecisions)
  decision: ModerationDecision;
}
