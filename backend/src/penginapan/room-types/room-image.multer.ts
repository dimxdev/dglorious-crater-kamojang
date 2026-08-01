import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const ROOM_IMAGE_UPLOAD_DIR = 'uploads/room-types';

/** Multer options for room gallery uploads — local disk (1-VPS deployment, §12 PROJECT.md). */
export const roomImageMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(ROOM_IMAGE_UPLOAD_DIR, { recursive: true });
      cb(null, ROOM_IMAGE_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, accept: boolean) => void,
  ) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new BadRequestException('File harus berupa gambar'), false);
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
};
