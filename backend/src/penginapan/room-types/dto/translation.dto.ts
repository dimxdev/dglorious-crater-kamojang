import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class TranslationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Cottage / Glamping / Tenda / Area Camping — translated per language. */
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  bedInfo?: string;

  @IsOptional()
  @IsString()
  bathroomInfo?: string;

  @IsOptional()
  @IsString()
  facilitiesText?: string;

  @IsOptional()
  @IsString()
  rules?: string;
}

/** ID wajib, EN opsional (§9 PROJECT.md — fallback ke ID kalau EN kosong). */
export class RoomTypeTranslationsDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => TranslationDto)
  id: TranslationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TranslationDto)
  en?: TranslationDto;
}
