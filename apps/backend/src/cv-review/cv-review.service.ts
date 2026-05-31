import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CvService } from '../cv/cv.service';

type ReviewPayload = {
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  keywordMatches: string[];
  structureScore: number;
  clarityScore: number;
  keywordScore: number;
  completenessScore: number;
};

@Injectable()
export class CvReviewService {
  private static readonly PROVIDER = 'openai:gpt-5.5';
  private static readonly OPENAI_URL = 'https://api.openai.com/v1/responses';
  private static readonly REQUEST_TIMEOUT_MS = 45_000;
  private static readonly MAX_CV_TEXT_CHARS = 16_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cvService: CvService,
    private readonly configService: ConfigService,
  ) {}

  async getLatestForUser(userId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { userId },
    });

    if (!cv) {
      throw new NotFoundException('CV not found.');
    }

    const latestReview = await this.prisma.cvReview.findFirst({
      where: {
        userId,
        cvId: cv.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latestReview) {
      return null;
    }

    return this.toClientReview(latestReview, cv.updatedAt);
  }

  async createForUser(userId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { userId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        user: {
          include: {
            jobSeekerProfile: true,
          },
        },
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found.');
    }

    const file = await this.cvService.getCvFileForUser(userId);
    const extractedText = this.extractSearchableText(file.buffer);
    const trimmedText = extractedText.slice(0, CvReviewService.MAX_CV_TEXT_CHARS);

    const tagNames = cv.tags.map((entry) => entry.tag.name);
    const preferredCategories =
      cv.user.jobSeekerProfile?.preferredJobCategories
        ?.split(',')
        .map((value) => value.trim())
        .filter(Boolean) ?? [];

    const reviewPayload = await this.buildReviewPayload({
      fileName: cv.fileName,
      text: trimmedText,
      tagNames,
      preferredCategories,
      location: cv.user.jobSeekerProfile?.location ?? '',
    });

    const createdReview = await this.prisma.cvReview.create({
      data: {
        userId,
        cvId: cv.id,
        provider: CvReviewService.PROVIDER,
        strengthsJson: JSON.stringify(reviewPayload.strengths),
        improvementsJson: JSON.stringify(reviewPayload.improvements),
        suggestionsJson: JSON.stringify(reviewPayload.suggestions),
        keywordMatchesJson: JSON.stringify(reviewPayload.keywordMatches),
        structureScore: reviewPayload.structureScore,
        clarityScore: reviewPayload.clarityScore,
        keywordScore: reviewPayload.keywordScore,
        completenessScore: reviewPayload.completenessScore,
        sourceCvUpdatedAt: cv.updatedAt,
      },
    });

    return this.toClientReview(createdReview, cv.updatedAt);
  }

  private extractSearchableText(buffer: Buffer) {
    const latinText = buffer.toString('latin1');

    return latinText
      .replace(/[^A-Za-z0-9@:/+.#,\-\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async buildReviewPayload(input: {
    fileName: string;
    text: string;
    tagNames: string[];
    preferredCategories: string[];
    location: string;
  }): Promise<ReviewPayload> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw this.createReviewUnavailableError(
        'OpenAI API key is not configured.',
      );
    }

    const keywordPool = [...input.tagNames, ...input.preferredCategories]
      .map((value) => value.trim())
      .filter(Boolean);

    let payload: {
      output?: Array<{
        type?: string;
        content?: Array<{
          type?: string;
          text?: string;
        }>;
      }>;
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        CvReviewService.REQUEST_TIMEOUT_MS,
      );
      let response: Response;

      try {
        response = await fetch(CvReviewService.OPENAI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: 'gpt-5.5',
            store: false,
            reasoning: {
              effort: 'medium',
            },
            max_output_tokens: 1200,
            instructions:
              'You are an expert CV reviewer. Review only the provided CV text. Do not mention hidden chain-of-thought. Return concise, practical feedback for a job seeker.',
            input: [
              {
                role: 'user',
                content: [
                  {
                    type: 'input_text',
                    text: [
                      'Review this CV text for structure, clarity, keyword alignment, and completeness.',
                      'Use the provided candidate metadata only as supporting context.',
                      `If the CV text looks truncated, still provide the best concise review you can from the available content.`,
                      `File name: ${input.fileName}`,
                      `Profile location: ${input.location || 'Not provided'}`,
                      `Preferred categories: ${input.preferredCategories.join(', ') || 'None provided'}`,
                      `CV/tag keywords: ${keywordPool.join(', ') || 'None provided'}`,
                      'CV text begins below:',
                      input.text || 'No readable CV text could be extracted.',
                    ].join('\n\n'),
                  },
                ],
              },
            ],
            text: {
              format: {
                type: 'json_schema',
                name: 'cv_review',
                strict: true,
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    strengths: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 1,
                      maxItems: 5,
                    },
                    improvements: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 1,
                      maxItems: 5,
                    },
                    suggestions: {
                      type: 'array',
                      items: { type: 'string' },
                      minItems: 1,
                      maxItems: 5,
                    },
                    keywordMatches: {
                      type: 'array',
                      items: { type: 'string' },
                      maxItems: 10,
                    },
                    structureScore: {
                      type: 'integer',
                      minimum: 1,
                      maximum: 5,
                    },
                    clarityScore: {
                      type: 'integer',
                      minimum: 1,
                      maximum: 5,
                    },
                    keywordScore: {
                      type: 'integer',
                      minimum: 1,
                      maximum: 5,
                    },
                    completenessScore: {
                      type: 'integer',
                      minimum: 1,
                      maximum: 5,
                    },
                  },
                  required: [
                    'strengths',
                    'improvements',
                    'suggestions',
                    'keywordMatches',
                    'structureScore',
                    'clarityScore',
                    'keywordScore',
                    'completenessScore',
                  ],
                },
              },
            },
          }),
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }

      payload = (await response.json()) as typeof payload;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.message.includes('aborted'))
      ) {
        throw this.createReviewUnavailableError(
          `Timed out after ${CvReviewService.REQUEST_TIMEOUT_MS}ms while waiting for OpenAI.`,
          'AI review took too long and was canceled. Please try again in a moment.',
        );
      }

      const detail =
        error instanceof Error ? error.message : 'Unknown AI review error.';
      throw this.createReviewUnavailableError(detail);
    }

    const rawText = payload.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === 'output_text')?.text;

    if (!rawText) {
      throw this.createReviewUnavailableError(
        'OpenAI response did not contain structured output.',
      );
    }

    let parsed: ReviewPayload;

    try {
      parsed = JSON.parse(rawText) as ReviewPayload;
    } catch {
      throw this.createReviewUnavailableError(
        'OpenAI response JSON could not be parsed.',
      );
    }

    return {
      strengths: this.uniqueFallback(parsed.strengths, [
        'The review completed successfully.',
      ]),
      improvements: this.uniqueFallback(parsed.improvements, [
        'No major issues were returned.',
      ]),
      suggestions: this.uniqueFallback(parsed.suggestions, [
        'Keep tailoring the CV to the roles you want most.',
      ]),
      keywordMatches: [...new Set(parsed.keywordMatches ?? [])],
      structureScore: this.clampScore(parsed.structureScore, 1, 5),
      clarityScore: this.clampScore(parsed.clarityScore, 1, 5),
      keywordScore: this.clampScore(parsed.keywordScore, 1, 5),
      completenessScore: this.clampScore(parsed.completenessScore, 1, 5),
    };
  }

  private uniqueFallback(values: string[], fallback: string[]) {
    const unique = [...new Set(values)];
    return unique.length > 0 ? unique : fallback;
  }

  private clampScore(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  private createReviewUnavailableError(detail: string, publicMessage?: string) {
    const referenceCode = `CVR-${Date.now().toString(36).toUpperCase()}`;
    console.error(`[AI_CV_REVIEW_ERROR:${referenceCode}] ${detail}`);

    return new ServiceUnavailableException(
      `${publicMessage ?? 'AI review is temporarily unavailable.'} Reference code: ${referenceCode}.`,
    );
  }

  private toClientReview(
    review: {
      id: string;
      provider: string;
      strengthsJson: string;
      improvementsJson: string;
      suggestionsJson: string;
      keywordMatchesJson: string | null;
      structureScore: number;
      clarityScore: number;
      keywordScore: number;
      completenessScore: number;
      sourceCvUpdatedAt: Date;
      createdAt: Date;
    },
    currentCvUpdatedAt: Date,
  ) {
    return {
      id: review.id,
      provider: review.provider,
      strengths: JSON.parse(review.strengthsJson) as string[],
      improvements: JSON.parse(review.improvementsJson) as string[],
      suggestions: JSON.parse(review.suggestionsJson) as string[],
      keywordMatches: review.keywordMatchesJson
        ? (JSON.parse(review.keywordMatchesJson) as string[])
        : [],
      structureScore: review.structureScore,
      clarityScore: review.clarityScore,
      keywordScore: review.keywordScore,
      completenessScore: review.completenessScore,
      sourceCvUpdatedAt: review.sourceCvUpdatedAt,
      createdAt: review.createdAt,
      isCurrentVersion:
        review.sourceCvUpdatedAt.getTime() === currentCvUpdatedAt.getTime(),
      reviewMode: 'OPT_IN',
      appStoresRawCvText: false,
      providerResponseStorage: 'disabled',
      requestTimeoutMs: CvReviewService.REQUEST_TIMEOUT_MS,
    };
  }
}
