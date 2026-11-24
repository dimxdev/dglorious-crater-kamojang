import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { trim } from './trim';

export class TranslationDto {
  @Transform(trim)
  @IsString({ message: 'Nama harus berupa teks.' })
  @IsNotEmpty({ message: 'Nama wajib diisi.' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter.' })
  name: string;

  /** Cottage / Glamping / Tenda / Area Camping — translated per language. */
  @Transform(trim)
  @IsString({ message: 'Kategori harus berupa teks.' })
  @IsNotEmpty({ message: 'Kategori wajib diisi.' })
  @MaxLength(60, { message: 'Kategori maksimal 60 karakter.' })
  category: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Tagline harus berupa teks.' })
  @MaxLength(160, { message: 'Tagline maksimal 160 karakter.' })
  tagline?: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Deskripsi harus berupa teks.' })
  @MaxLength(3000, { message: 'Deskripsi maksimal 3000 karakter.' })
  description?: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Info tempat tidur harus berupa teks.' })
  @MaxLength(300, { message: 'Info tempat tidur maksimal 300 karakter.' })
  bedInfo?: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Info kamar mandi harus berupa teks.' })
  @MaxLength(300, { message: 'Info kamar mandi maksimal 300 karakter.' })
  bathroomInfo?: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Aturan harus berupa teks.' })
  @MaxLength(3000, { message: 'Aturan maksimal 3000 karakter.' })
  rules?: string;
}

/** ID wajib, EN opsional (§9 PROJECT.md — fallback ke ID kalau EN kosong). */
export class RoomTypeTranslationsDto {
  @IsDefined({ message: 'Terjemahan Bahasa Indonesia wajib diisi.' })
  @ValidateNested()
  @Type(() => TranslationDto)
  id: TranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  en?: TranslationDto;
}
