import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export function cvFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestException('Only PDF, DOC, and DOCX files are allowed'),
      false,
    );
  }

  callback(null, true);
}

export const cvStorage = memoryStorage();
