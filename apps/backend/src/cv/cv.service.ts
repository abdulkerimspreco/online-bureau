import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { join } from 'path';
import { CVVisibility } from '@prisma/client';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import { decryptCvBuffer, encryptCvBuffer } from './cv.crypto';

@Injectable()
export class CvService {
    private static readonly PRIVATE_STORAGE_DIR = join(process.cwd(), 'private', 'cvs');

    constructor(private readonly prisma: PrismaService) { }

    async getMyCv(userId: string) {
        const cv = await this.prisma.cv.findFirst({
            where: { userId },
        });

        if (!cv) {
            throw new NotFoundException('CV not found');
        }

        return this.toClientCv(cv);
    }

    async uploadCv(userId: string, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('CV file is required');
        }

        if (file.size > 10 * 1024 * 1024) {
            throw new BadRequestException('Maximum file size is 10MB');
        }

        if (!file.buffer) {
            throw new BadRequestException('Uploaded CV data is missing');
        }

        const existingCv = await this.prisma.cv.findUnique({
            where: { userId },
        });

        const storagePath = this.buildStoragePath();
        const encryptedPayload = encryptCvBuffer(file.buffer);

        await mkdir(CvService.PRIVATE_STORAGE_DIR, { recursive: true });
        await writeFile(storagePath, encryptedPayload.encrypted);

        if (existingCv) {
            const oldPath = this.resolveStoredPath(existingCv.fileUrl);

            if (oldPath) {
                try {
                    await unlink(oldPath);
                } catch {
                    // old file missing is not fatal
                }
            }

            const updatedCv = await this.prisma.cv.update({
                where: { userId },
                data: {
                    fileName: file.originalname,
                    fileUrl: storagePath,
                    mimeType: file.mimetype,
                    fileSize: file.size,
                    encryptionIv: encryptedPayload.iv,
                    encryptionAuthTag: encryptedPayload.authTag,
                },
            });

            return this.toClientCv(updatedCv);
        }

        const createdCv = await this.prisma.cv.create({
            data: {
                userId,
                fileName: file.originalname,
                fileUrl: storagePath,
                mimeType: file.mimetype,
                fileSize: file.size,
                encryptionIv: encryptedPayload.iv,
                encryptionAuthTag: encryptedPayload.authTag,
            },
        });

        return this.toClientCv(createdCv);
    }

    async updateVisibility(userId: string, visibility: CVVisibility) {
        const existingCv = await this.prisma.cv.findUnique({
            where: { userId },
        });

        if (!existingCv) {
            throw new NotFoundException('CV not found');
        }

        const updatedCv = await this.prisma.cv.update({
            where: { userId },
            data: { visibility },
        });

        return this.toClientCv(updatedCv);
    }

    async getMyCvFile(userId: string) {
        const cv = await this.prisma.cv.findUnique({
            where: { userId },
        });

        if (!cv) {
            throw new NotFoundException('CV not found');
        }

        const storedPath = this.resolveStoredPath(cv.fileUrl);

        if (!storedPath) {
            throw new NotFoundException('Stored CV file not found');
        }

        const fileBytes = await readFile(storedPath);
        const fileBuffer =
            cv.encryptionIv && cv.encryptionAuthTag
                ? decryptCvBuffer(fileBytes, cv.encryptionIv, cv.encryptionAuthTag)
                : fileBytes;

        return {
            fileName: cv.fileName,
            mimeType: cv.mimeType,
            buffer: fileBuffer,
        };
    }

    async deleteMyCv(userId: string) {
        const existingCv = await this.prisma.cv.findUnique({
            where: { userId },
        });

        if (!existingCv) {
            throw new NotFoundException('CV not found');
        }

        const oldPath = this.resolveStoredPath(existingCv.fileUrl);

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

    private buildStoragePath() {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        return join(CvService.PRIVATE_STORAGE_DIR, `cv-${uniqueSuffix}.bin`);
    }

    private resolveStoredPath(fileUrl: string | null | undefined) {
        if (!fileUrl) return null;

        if (fileUrl.startsWith('/uploads/')) {
            return join(process.cwd(), fileUrl.slice(1));
        }

        if (fileUrl.startsWith('/')) {
            return fileUrl;
        }

        return join(process.cwd(), fileUrl);
    }

    private toClientCv<T extends {
        id: string;
        userId: string;
        fileName: string;
        fileUrl: string;
        mimeType: string;
        fileSize: number;
        visibility: CVVisibility;
        createdAt: Date;
        updatedAt: Date;
    }>(cv: T) {
        return {
            id: cv.id,
            userId: cv.userId,
            fileName: cv.fileName,
            fileUrl: '/cv/me/file',
            mimeType: cv.mimeType,
            fileSize: cv.fileSize,
            visibility: cv.visibility,
            createdAt: cv.createdAt,
            updatedAt: cv.updatedAt,
        };
    }
}
