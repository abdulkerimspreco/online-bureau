import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CvReviewProvider,
  CvReviewRequest,
  ReviewPayload,
} from './cv-review.types';

@Injectable()
export class OpenAiCvReviewAdapter implements CvReviewProvider {
  readonly providerName = 'openai:gpt-5.5';

  private static readonly OPENAI_URL = 'https://api.openai.com/v1/responses';
  private static readonly REQUEST_TIMEOUT_MS = 45_000;

  constructor(private readonly configService: ConfigService) {}

  async generateReview(input: CvReviewRequest): Promise<ReviewPayload> {
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
        OpenAiCvReviewAdapter.REQUEST_TIMEOUT_MS,
      );
      let response: Response;

      try {
        response = await fetch(OpenAiCvReviewAdapter.OPENAI_URL, {
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
          `Timed out after ${OpenAiCvReviewAdapter.REQUEST_TIMEOUT_MS}ms while waiting for OpenAI.`,
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

  static getRequestTimeoutMs() {
    return OpenAiCvReviewAdapter.REQUEST_TIMEOUT_MS;
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
}
