import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateJobSeekerProfileDto } from './dto/update-job-seeker-profile.dto';

@Injectable()
export class JobSeekersService {
    constructor(private readonly prisma: PrismaService) { }

    async getMyProfile(userId: string) {
        const profile = await this.prisma.jobSeekerProfile.findUnique({
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
            throw new NotFoundException('Job seeker profile not found');
        }

        return profile;
    }

    async updateMyProfile(userId: string, dto: UpdateJobSeekerProfileDto) {
        const existingProfile = await this.prisma.jobSeekerProfile.findUnique({
            where: { userId },
        });

        if (!existingProfile) {
            throw new NotFoundException('Job seeker profile not found');
        }

        return this.prisma.jobSeekerProfile.update({
            where: { userId },
            data: {
                displayName: dto.displayName,
                location: dto.location,
                preferredJobCategories: dto.preferredJobCategories,
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
}
