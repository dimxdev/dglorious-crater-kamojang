import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { trim } from './trim';

/**
 * One facility entry with its own inline per-language label — chosen over a
 * separate keys+lookup-table design because the admin CMS form
 * (`FacilityListEditor.tsx`) already edits icon+label pairs directly per
 * language, with no separate facility dictionary anywhere in the app.
 */
export class FacilityLabelDto {
  @Transform(trim)
  @IsString({ message: 'Nama fasilitas harus berupa teks.' })
  @IsNotEmpty({ message: 'Nama fasilitas wajib diisi.' })
  @MaxLength(100, { message: 'Nama fasilitas maksimal 100 karakter.' })
  id: string;

  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Nama fasilitas (EN) harus berupa teks.' })
  @MaxLength(100, { message: 'Nama fasilitas (EN) maksimal 100 karakter.' })
  en?: string;
}

export class FacilityDto {
  /** Lucide icon name (frontend/lib/icons.ts). Not validated against that
   *  list here — keeping backend decoupled from a frontend-only registry. */
  @Transform(trim)
  @IsString({ message: 'Ikon fasilitas harus berupa teks.' })
  @IsNotEmpty({ message: 'Ikon fasilitas wajib diisi.' })
  @MaxLength(100, { message: 'Ikon fasilitas maksimal 100 karakter.' })
  icon: string;

  @ValidateNested()
  @Type(() => FacilityLabelDto)
  label: FacilityLabelDto;
}
