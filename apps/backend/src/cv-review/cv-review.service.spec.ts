import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CvService } from '../cv/cv.service';
import { CvReviewService } from './cv-review.service';

type MockedPrisma = {
  cv: {
    findUnique: jest.Mock;
  };
  cvReview: {
    findFirst: jest.Mock;
    create: jest.Mock;
  };
};

describe('CvReviewService', () => {
  let service: CvReviewService;
  let prisma: MockedPrisma;
  let cvService: { getCvFileForUser: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(() => {
    prisma = {
      cv: {
        findUnique: jest.fn(),
      },
      cvReview: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    cvService = {
      getCvFileForUser: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('test-openai-key'),
    };

    service = new CvReviewService(
      prisma as unknown as PrismaService,
      cvService as unknown as CvService,
      configService as unknown as ConfigService,
    );
  });

  it('throws when creating a review without a CV', async () => {
    prisma.cv.findUnique.mockResolvedValue(null);

    await expect(service.createForUser('user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates categorized review feedback for the current CV', async () => {
    const updatedAt = new Date('2026-05-31T10:00:00.000Z');
    prisma.cv.findUnique.mockResolvedValue({
      id: 'cv-1',
      userId: 'user-1',
      fileName: 'cv.pdf',
      updatedAt,
      tags: [{ tag: { name: 'React' } }, { tag: { name: 'Backend' } }],
      user: {
        jobSeekerProfile: {
          preferredJobCategories: 'Frontend, React',
          location: 'Sarajevo',
        },
      },
    });
    cvService.getCvFileForUser.mockResolvedValue({
      buffer: Buffer.from(
        'John Doe john@example.com +387 61 123 456 Summary Experience Education Skills Projects React Backend improved performance by 35%',
      ),
    });
    const fetchMock = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  strengths: ['Strong contact details and clear role alignment.'],
                  improvements: ['Expand recent experience bullets with more depth.'],
                  suggestions: ['Add one more quantified project outcome.'],
                  keywordMatches: ['React', 'Backend'],
                  structureScore: 4,
                  clarityScore: 4,
                  keywordScore: 5,
                  completenessScore: 4,
                }),
              },
            ],
          },
        ],
      }),
    } as Response);
    prisma.cvReview.create.mockImplementation(async ({ data }: any) => ({
      id: 'review-1',
      provider: data.provider,
      strengthsJson: data.strengthsJson,
      improvementsJson: data.improvementsJson,
      suggestionsJson: data.suggestionsJson,
      keywordMatchesJson: data.keywordMatchesJson,
      structureScore: data.structureScore,
      clarityScore: data.clarityScore,
      keywordScore: data.keywordScore,
      completenessScore: data.completenessScore,
      sourceCvUpdatedAt: data.sourceCvUpdatedAt,
      createdAt: new Date('2026-05-31T10:05:00.000Z'),
    }));

    const result = await service.createForUser('user-1');

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.keywordMatches).toContain('React');
    expect(result.isCurrentVersion).toBe(true);
    expect(prisma.cvReview.create).toHaveBeenCalled();
    fetchMock.mockRestore();
  });
});
