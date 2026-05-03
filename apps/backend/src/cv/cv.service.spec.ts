import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CVVisibility } from '@prisma/client';
import { unlink } from 'fs/promises';
import { CvService } from './cv.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
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
    const file = {
      originalname: 'cv.pdf',
      filename: 'saved.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;
    const created = { id: 'cv-1', fileName: 'cv.pdf' };

    prisma.cv.findUnique.mockResolvedValue(null);
    prisma.cv.create.mockResolvedValue(created);

    const result = await service.uploadCv('user-1', file);

    expect(prisma.cv.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        fileName: 'cv.pdf',
        fileUrl: '/uploads/cvs/saved.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
      },
    });
    expect(result).toBe(created);
  });

  it('replaces an existing cv and tries to delete the old file', async () => {
    const file = {
      originalname: 'cv-new.pdf',
      filename: 'saved-new.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;
    const existingCv = {
      id: 'cv-1',
      userId: 'user-1',
      fileUrl: '/uploads/cvs/old.pdf',
    };

    prisma.cv.findUnique.mockResolvedValue(existingCv);
    prisma.cv.update.mockResolvedValue({ id: 'cv-1', fileName: 'cv-new.pdf' });

    await service.uploadCv('user-1', file);

    expect(unlink).toHaveBeenCalledWith('./uploads/cvs/old.pdf');
    expect(prisma.cv.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: {
        fileName: 'cv-new.pdf',
        fileUrl: '/uploads/cvs/saved-new.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
      },
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

    expect(unlink).toHaveBeenCalledWith('./uploads/cvs/current.pdf');
    expect(prisma.cv.delete).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(result).toEqual({ message: 'CV deleted successfully' });
  });
});
