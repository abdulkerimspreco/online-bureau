import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
    CVVisibility,
    ContactRequestStatus,
    Prisma,
    UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
    SearchCandidatesDto,
    SearchTagModeDto,
} from './dto/search-candidates.dto';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';

interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
}

@Injectable()
export class EmployersService {
    private static readonly SEARCH_PAGE_SIZE = 20;

    constructor(private readonly prisma: PrismaService) { }

    async getMyProfile(userId: string) {
        const profile = await this.prisma.employerProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        isVerified: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!profile) {
            throw new NotFoundException('Employer profile not found');
        }

        return profile;
    }

    async updateMyProfile(userId: string, dto: UpdateEmployerProfileDto) {
        const existingProfile = await this.prisma.employerProfile.findUnique({
            where: { userId },
        });

        if (!existingProfile) {
            throw new NotFoundException('Employer profile not found');
        }

        return this.prisma.employerProfile.update({
            where: { userId },
            data: {
                companyName: dto.companyName,
                description: dto.description,
                website: dto.website,
                industry: dto.industry,
                companySize: dto.companySize,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        isVerified: true,
                        createdAt: true,
                    },
                },
            },
        });
    }

    async searchCandidates(user: AuthUser, dto: SearchCandidatesDto) {
        if (!user.isVerified) {
            throw new ForbiddenException(
                'Please verify your email before searching candidates.',
            );
        }

        const page = dto.page ?? 1;
        const query = dto.query?.trim();
        const location = dto.location?.trim();
        const filters: Prisma.CvWhereInput[] = [
            {
                visibility: {
                    in: [CVVisibility.PUBLIC, CVVisibility.COMPANY_ONLY],
                },
            },
            {
                user: {
                    is: {
                        role: UserRole.JOB_SEEKER,
                        jobSeekerProfile: {
                            isNot: null,
                        },
                        mutedCompanies: {
                            none: {
                                employerId: user.id,
                            },
                        },
                    },
                },
            },
        ];

        if (location) {
            filters.push({
                user: {
                    is: {
                        jobSeekerProfile: {
                            is: {
                                location: {
                                    contains: location,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    },
                },
            });
        }

        const tagIds = Array.from(
            new Set([...(dto.tagIds ?? []), ...(dto.tagId ? [dto.tagId] : [])]),
        );

        if (tagIds.length > 0) {
            const tagFilter =
                dto.tagMode === SearchTagModeDto.ALL
                    ? {
                        AND: tagIds.map((tagId) => ({
                            tags: {
                                some: {
                                    tagId,
                                },
                            },
                        })),
                    }
                    : {
                        tags: {
                            some: {
                                tagId: {
                                    in: tagIds,
                                },
                            },
                        },
                    };

            filters.push({
                ...tagFilter,
            });
        }

        if (query) {
            filters.push({
                OR: [
                    {
                        user: {
                            is: {
                                jobSeekerProfile: {
                                    is: {
                                        displayName: {
                                            contains: query,
                                            mode: 'insensitive',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        user: {
                            is: {
                                jobSeekerProfile: {
                                    is: {
                                        location: {
                                            contains: query,
                                            mode: 'insensitive',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        user: {
                            is: {
                                jobSeekerProfile: {
                                    is: {
                                        preferredJobCategories: {
                                            contains: query,
                                            mode: 'insensitive',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    {
                        tags: {
                            some: {
                                tag: {
                                    name: {
                                        contains: query,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                    },
                ],
            });
        }

        const where: Prisma.CvWhereInput = {
            AND: filters,
        };

        const [total, cvs] = await Promise.all([
            this.prisma.cv.count({ where }),
            this.prisma.cv.findMany({
                where,
                orderBy: [
                    { updatedAt: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip: (page - 1) * EmployersService.SEARCH_PAGE_SIZE,
                take: EmployersService.SEARCH_PAGE_SIZE,
                include: {
                    user: {
                        select: {
                            id: true,
                            jobSeekerProfile: true,
                        },
                    },
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            }),
        ]);

        const items = cvs
            .filter((cv) => cv.user.jobSeekerProfile)
            .map((cv) => ({
                cvId: cv.id,
                candidateId: cv.user.id,
                displayName: cv.user.jobSeekerProfile?.displayName ?? 'Anonymous candidate',
                location: cv.user.jobSeekerProfile?.location ?? '',
                preferredJobCategories:
                    cv.user.jobSeekerProfile?.preferredJobCategories ?? null,
                visibility: cv.visibility,
                createdAt: cv.createdAt,
                updatedAt: cv.updatedAt,
                tags: cv.tags.map((entry) => ({
                    id: entry.tag.id,
                    name: entry.tag.name,
                })),
            }));

        return {
            items,
            total,
            page,
            perPage: EmployersService.SEARCH_PAGE_SIZE,
        };
    }

    async getCandidateProfile(user: AuthUser, candidateId: string) {
        if (!user.isVerified) {
            throw new ForbiddenException(
                'Please verify your email before viewing candidate profiles.',
            );
        }

        const cv = await this.prisma.cv.findFirst({
            where: {
                userId: candidateId,
                visibility: {
                    in: [CVVisibility.PUBLIC, CVVisibility.COMPANY_ONLY],
                },
                user: {
                    role: UserRole.JOB_SEEKER,
                    jobSeekerProfile: {
                        isNot: null,
                    },
                    mutedCompanies: {
                        none: {
                            employerId: user.id,
                        },
                    },
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        jobSeekerProfile: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });

        if (!cv || !cv.user.jobSeekerProfile) {
            throw new NotFoundException('Candidate profile not found');
        }

        const latestContactRequest = await this.prisma.contactRequest.findFirst({
            where: {
                employerId: user.id,
                candidateId,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        let canRequestAgainAt: Date | null = null;

        if (latestContactRequest?.status === ContactRequestStatus.DECLINED) {
            canRequestAgainAt = new Date(latestContactRequest.updatedAt);
            canRequestAgainAt.setDate(canRequestAgainAt.getDate() + 30);
        }

        return {
            cvId: cv.id,
            candidateId: cv.user.id,
            displayName: cv.user.jobSeekerProfile.displayName ?? 'Anonymous candidate',
            location: cv.user.jobSeekerProfile.location ?? '',
            preferredJobCategories:
                cv.user.jobSeekerProfile.preferredJobCategories ?? null,
            visibility: cv.visibility,
            createdAt: cv.createdAt,
            updatedAt: cv.updatedAt,
            tags: cv.tags.map((entry) => ({
                id: entry.tag.id,
                name: entry.tag.name,
            })),
            contactRequest: latestContactRequest
                ? {
                    id: latestContactRequest.id,
                    status: latestContactRequest.status,
                    message: latestContactRequest.message,
                    createdAt: latestContactRequest.createdAt,
                    updatedAt: latestContactRequest.updatedAt,
                    canRequestAgainAt,
                    contactEmail:
                        latestContactRequest.status === ContactRequestStatus.ACCEPTED
                            ? cv.user.email
                            : null,
                }
                : null,
        };
    }
}
