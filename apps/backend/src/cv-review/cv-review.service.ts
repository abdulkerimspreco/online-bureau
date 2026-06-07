import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CvService } from '../cv/cv.service';
import { CV_REVIEW_PROVIDER } from './cv-review.types';
import type { CvReviewProvider } from './cv-review.types';
import { OpenAiCvReviewAdapter } from './openai-cv-review.adapter';

@Injectable()
export class CvReviewService {
  private static readonly MAX_CV_TEXT_CHARS = 16_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cvService: CvService,
    @Inject(CV_REVIEW_PROVIDER)
    private readonly cvReviewProvider: CvReviewProvider,
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
        provider: this.cvReviewProvider.providerName,
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
  }) {
    return this.cvReviewProvider.generateReview(input);
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
      requestTimeoutMs: OpenAiCvReviewAdapter.getRequestTimeoutMs(),
    };
  }
}
