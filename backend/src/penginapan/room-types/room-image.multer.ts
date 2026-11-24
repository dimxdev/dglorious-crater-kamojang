import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

/** Ubah galat "File too large" bawaan multer (413) menjadi pesan Indonesia. */
@Catch(PayloadTooLargeException)
export class ImageTooLargeFilter implements ExceptionFilter {
  catch(_e: PayloadTooLargeException, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().status(413).json({
      statusCode: 413,
      message: 'Ukuran gambar maksimal 5 MB.',
      error: 'Payload Too Large',
    });
  }
}

export const ROOM_IMAGE_UPLOAD_DIR = 'uploads/room-types';

/** Multer options for room gallery uploads — local disk (1-VPS deployment, §12 PROJECT.md). */
export const roomImageMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(ROOM_IMAGE_UPLOAD_DIR, { recursive: true });
      cb(null, ROOM_IMAGE_UPLOAD_DIR);
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
