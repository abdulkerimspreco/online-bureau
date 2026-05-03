import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { CVVisibility } from '@prisma/client';
import { unlink } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CvService {
    constructor(private readonly prisma: PrismaService) { }

    async getMyCv(userId: string) {
        const cv = await this.prisma.cv.findFirst({
            where: { userId },
        });

        if (!cv) {
            throw new NotFoundException('CV not found');
        }

        return cv;
    }

    async uploadCv(userId: string, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('CV file is required');
        }

        if (file.size > 10 * 1024 * 1024) {
            throw new BadRequestException('Maximum file size is 10MB');
        }

        const existingCv = await this.prisma.cv.findUnique({
            where: { userId },
        });

        const fileUrl = `/uploads/cvs/${file.filename}`;

        if (existingCv) {
            const oldPath = existingCv.fileUrl.startsWith('/uploads/')
                ? `.${existingCv.fileUrl}`
                : null;

            if (oldPath) {
                try {
                    await unlink(oldPath);
                } catch {
                    // old file missing is not fatal
                }
            }

            return this.prisma.cv.update({
                where: { userId },
                data: {
                    fileName: file.originalname,
                    fileUrl,
                    mimeType: file.mimetype,
                    fileSize: file.size,
                },
            });
        }

        return this.prisma.cv.create({
            data: {
                userId,
                fileName: file.originalname,
                fileUrl,
                mimeType: file.mimetype,
                fileSize: file.size,
            },
        });
    }

    async updateVisibility(userId: string, visibility: CVVisibility) {
        const existingCv = await this.prisma.cv.findUnique({
            where: { userId },
        });

        if (!existingCv) {
            throw new NotFoundException('CV not found');
        }

        return this.prisma.cv.update({
            where: { userId },
            data: { visibility },
        });
    }

    async deleteMyCv(userId: string) {
        const existingCv = await this.prisma.cv.findUnique({
            where: { userId },
        });

        if (!existingCv) {
            throw new NotFoundException('CV not found');
        }

        const oldPath = existingCv.fileUrl.startsWith('/uploads/')
            ? `.${existingCv.fileUrl}`
            : null;

        if (oldPath) {
            try {
                await unlink(oldPath);
            } catch {
                // file may already be missing
            }
        }

        await this.prisma.cv.delete({
            where: { userId },
        });

        return {
            message: 'CV deleted successfully',
        };
    }
}
