import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

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

export const cvStorage = diskStorage({
  destination: './uploads/cvs',
  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = extname(file.originalname);
    callback(null, `cv-${uniqueSuffix}${extension}`);
  },
});