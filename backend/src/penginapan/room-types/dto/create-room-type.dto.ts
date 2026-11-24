import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { FacilityDto } from './facility.dto';
import { RoomTypeTranslationsDto } from './translation.dto';
import { trim } from './trim';

const MAX_PRICE = 1_000_000_000;
const PRICE_INT = { message: 'Harga harus berupa bilangan bulat (rupiah).' };
const EXTRA_INT = {
  message: 'Biaya tambahan harus berupa bilangan bulat (rupiah).',
};
const EXTRA_MIN = { message: 'Biaya tambahan tidak boleh negatif.' };
const EXTRA_MAX = { message: 'Biaya tambahan maksimal Rp1.000.000.000.' };

export class CreateRoomTypeDto {
  /** URL-safe identifier, e.g. "eagle-hill". Immutable after creation. */
  @Transform(trim)
  @IsString({ message: 'Slug harus berupa teks.' })
  @MaxLength(100, { message: 'Slug maksimal 100 karakter.' })
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'Slug hanya boleh huruf kecil, angka, dan tanda hubung.',
  })
  slug: string;

  @IsInt(PRICE_INT)
  @Min(1, { message: 'Harga minimal Rp1.' })
  @Max(MAX_PRICE, { message: 'Harga maksimal Rp1.000.000.000.' })
  priceWeekday: number;

  @IsInt(PRICE_INT)
  @Min(1, { message: 'Harga minimal Rp1.' })
  @Max(MAX_PRICE, { message: 'Harga maksimal Rp1.000.000.000.' })
  priceWeekend: number;

  @IsInt({ message: 'Kapasitas harus berupa bilangan bulat.' })
  @Min(1, { message: 'Kapasitas minimal 1 orang.' })
  @Max(50, { message: 'Kapasitas maksimal 50 orang.' })
  capacity: number;

  @IsInt({ message: 'Jumlah unit harus berupa bilangan bulat.' })
  @Min(0, { message: 'Jumlah unit tidak boleh negatif.' })
  @Max(100, { message: 'Jumlah unit maksimal 100.' })
  totalUnits: number;

  /** §"KETENTUAN PENAMBAHAN ORANG" (PROJECT.md §11) — with/without extra bed. */
  @IsOptional()
  @IsInt(EXTRA_INT)
  @Min(0, EXTRA_MIN)
  @Max(MAX_PRICE, EXTRA_MAX)
  extraBedPrice?: number;

  @IsOptional()
  @IsInt(EXTRA_INT)
  @Min(0, EXTRA_MIN)
  @Max(MAX_PRICE, EXTRA_MAX)
  extraNoBedPrice?: number;

  /** Flat per-person rate — only Glorious Campervan uses this. */
  @IsOptional()
  @IsInt(EXTRA_INT)
  @Min(0, EXTRA_MIN)
  @Max(MAX_PRICE, EXTRA_MAX)
  extraFlatPrice?: number;

  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa true/false.' })
  isActive?: boolean;

  @IsArray({ message: 'Fasilitas harus berupa daftar.' })
  @ArrayMaxSize(40, { message: 'Fasilitas maksimal 40 item.' })
  @ValidateNested({ each: true })
  @Type(() => FacilityDto)
  facilities: FacilityDto[];

  @IsDefined({ message: 'Terjemahan wajib diisi.' })
  @ValidateNested()
  @Type(() => RoomTypeTranslationsDto)
  translations: RoomTypeTranslationsDto;
}
