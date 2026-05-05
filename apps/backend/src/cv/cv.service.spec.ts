import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CVVisibility } from '@prisma/client';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { CvService } from './cv.service';
import { PrismaService } from '../prisma/prisma.service';
import * as cryptoHelpers from './cv.crypto';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

type MockedPrisma = {
  cv: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('CvService', () => {
  let service: CvService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      cv: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new CvService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when the current user has no cv', async () => {
    prisma.cv.findFirst.mockResolvedValue(null);

    await expect(service.getMyCv('user-1')).rejects.toThrow(NotFoundException);
  });

  it('creates a cv when uploading for the first time', async () => {
    jest.spyOn(cryptoHelpers, 'encryptCvBuffer').mockReturnValue({
      encrypted: Buffer.from('encrypted'),
      iv: 'iv-value',
      authTag: 'tag-value',
    });

    const file = {
      originalname: 'cv.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('plain'),
    } as Express.Multer.File;
    const created = {
      id: 'cv-1',
      userId: 'user-1',
      fileName: 'cv.pdf',
      fileUrl: '/tmp/private-path',
      mimeType: 'application/pdf',
      fileSize: 1024,
      visibility: CVVisibility.PRIVATE,
      createdAt: new Date('2026-05-05T18:00:00.000Z'),
      updatedAt: new Date('2026-05-05T18:00:00.000Z'),
      encryptionIv: 'iv-value',
      encryptionAuthTag: 'tag-value',
    };

    prisma.cv.findUnique.mockResolvedValue(null);
    prisma.cv.create.mockResolvedValue(created);

    const result = await service.uploadCv('user-1', file);

    expect(mkdir).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalled();
    expect(prisma.cv.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        fileName: 'cv.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        encryptionIv: 'iv-value',
        encryptionAuthTag: 'tag-value',
      }),
    });
    expect(result.fileUrl).toBe('/cv/me/file');
  });

  it('replaces an existing cv and tries to delete the old file', async () => {
    jest.spyOn(cryptoHelpers, 'encryptCvBuffer').mockReturnValue({
      encrypted: Buffer.from('encrypted'),
      iv: 'new-iv',
      authTag: 'new-tag',
    });

    const file = {
      originalname: 'cv-new.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('plain'),
    } as Express.Multer.File;
    const existingCv = {
      id: 'cv-1',
      userId: 'user-1',
      fileUrl: '/uploads/cvs/old.pdf'
    };

    prisma.cv.findUnique.mockResolvedValue(existingCv);
    prisma.cv.update.mockResolvedValue({
      id: 'cv-1',
      userId: 'user-1',
      fileName: 'cv-new.pdf',
      fileUrl: '/tmp/new-private-path',
      mimeType: 'application/pdf',
      fileSize: 1024,
      visibility: CVVisibility.PRIVATE,
      createdAt: new Date('2026-05-05T18:00:00.000Z'),
      updatedAt: new Date('2026-05-05T18:30:00.000Z'),
      encryptionIv: 'new-iv',
      encryptionAuthTag: 'new-tag',
    });

    await service.uploadCv('user-1', file);

    expect(unlink).toHaveBeenCalledWith(expect.stringContaining('uploads/cvs/old.pdf'));
    expect(prisma.cv.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: expect.objectContaining({
        fileName: 'cv-new.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        encryptionIv: 'new-iv',
        encryptionAuthTag: 'new-tag',
      }),
    });
  });

  it('rejects uploads larger than 10MB', async () => {
    const file = {
      originalname: 'large.pdf',
      filename: 'large.pdf',
      mimetype: 'application/pdf',
      size: 10 * 1024 * 1024 + 1,
    } as Express.Multer.File;

    await expect(service.uploadCv('user-1', file)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws when changing visibility for a missing cv', async () => {
    prisma.cv.findUnique.mockResolvedValue(null);

    await expect(
      service.updateVisibility('user-1', CVVisibility.PUBLIC),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes an existing cv and removes the stored file', async () => {
    prisma.cv.findUnique.mockResolvedValue({
      userId: 'user-1',
      fileUrl: '/uploads/cvs/current.pdf',
    });

    const result = await service.deleteMyCv('user-1');

    expect(unlink).toHaveBeenCalledWith(expect.stringContaining('uploads/cvs/current.pdf'));
    expect(prisma.cv.delete).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(result).toEqual({ message: 'CV deleted successfully' });
  });

  it('decrypts an encrypted cv file for the current user', async () => {
    jest.spyOn(cryptoHelpers, 'decryptCvBuffer').mockReturnValue(
      Buffer.from('plain-file'),
    );

    prisma.cv.findUnique.mockResolvedValue({
      id: 'cv-1',
      userId: 'user-1',
      fileName: 'cv.pdf',
      fileUrl: '/private/cvs/encrypted.bin',
      mimeType: 'application/pdf',
      fileSize: 1024,
      visibility: CVVisibility.PRIVATE,
      createdAt: new Date('2026-05-05T18:00:00.000Z'),
      updatedAt: new Date('2026-05-05T18:00:00.000Z'),
      encryptionIv: 'iv-value',
      encryptionAuthTag: 'tag-value',
    });
    (readFile as jest.Mock).mockResolvedValue(Buffer.from('encrypted-file'));

    const result = await service.getMyCvFile('user-1');

    expect(result.fileName).toBe('cv.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.buffer.toString()).toBe('plain-file');
  });
});
