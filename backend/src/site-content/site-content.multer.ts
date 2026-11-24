import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

import {
  ALLOWED_IMAGE_EXT,
  ALLOWED_IMAGE_MIME,
} from '../penginapan/room-types/room-image.multer';

export const SITE_IMAGE_UPLOAD_DIR = 'uploads/site';

/** Multer untuk gambar konten situs — disk lokal, pola sama dengan galeri tenda. */
export const siteImageMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(SITE_IMAGE_UPLOAD_DIR, { recursive: true });
      cb(null, SITE_IMAGE_UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, accept: boolean) => void,
  ) => {
    const ext = extname(file.originalname).toLowerCase();
    if (
      !ALLOWED_IMAGE_MIME.includes(file.mimetype) ||
      !ALLOWED_IMAGE_EXT.includes(ext)
    ) {
      cb(
        new BadRequestException(
          'File harus berupa gambar JPG, PNG, atau WebP.',
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
  // Busboy menolak begitu ukuran MENCAPAI batas, jadi +1 agar file tepat 5 MB tetap diterima.
  limits: { fileSize: 5 * 1024 * 1024 + 1 }, // maks 5 MB (inklusif)
};
