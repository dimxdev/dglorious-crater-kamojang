import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  IsRealDate,
  MAX_MONEY,
  MONEY_INT_MESSAGE,
  MONEY_MAX_MESSAGE,
  trimString,
} from '../stay-validation.util';
import { normalizeIdPhone, PHONE_MESSAGE, PHONE_REGEX } from '../../../common/phone';

const NOTE_MESSAGE = 'Alasan edit wajib diisi (minimal 3 karakter)';

export class EditReservationItemInput {
  @IsInt({ message: 'Tipe tenda tidak valid.' })
  roomTypeId: number;

  @IsInt({ message: 'Jumlah tamu dewasa harus bilangan bulat.' })
  @Min(1, { message: 'Minimal 1 tamu dewasa per unit.' })
  @Max(50, { message: 'Jumlah tamu dewasa maksimal 50 per unit.' })
  adults: number;

  @IsInt({ message: 'Jumlah anak harus bilangan bulat.' })
  @Min(0, { message: 'Jumlah anak tidak boleh negatif.' })
  @Max(50, { message: 'Jumlah anak maksimal 50 per unit.' })
  children: number;

  @IsOptional()
  @IsInt({ message: 'Jumlah extra bed harus bilangan bulat.' })
  @Min(0, { message: 'Jumlah extra bed tidak boleh negatif.' })
  @Max(5, { message: 'Extra bed maksimal 5 per unit.' })
  extraBedQty?: number;

  @IsOptional()
  @IsEnum(['WITH_BED', 'WITHOUT_BED'], {
    message: 'Jenis extra bed tidak valid.',
  })
  extraBedType?: 'WITH_BED' | 'WITHOUT_BED';
}

export class EditReservationDto {
  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'Nama tamu wajib diisi.' })
  @IsNotEmpty({ message: 'Nama tamu wajib diisi.' })
  @MaxLength(100, { message: 'Nama tamu maksimal 100 karakter.' })
  guestName?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeIdPhone(value))
  @IsString({ message: PHONE_MESSAGE })
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  guestPhone?: string;

  @IsOptional()
  @IsRealDate()
  checkIn?: string;

  @IsOptional()
  @IsRealDate()
  checkOut?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'Catatan tidak valid.' })
  @MaxLength(500, { message: 'Catatan maksimal 500 karakter.' })
  notes?: string;

  @IsOptional()
  @IsArray({ message: 'Pilih minimal satu tenda.' })
  @ArrayMinSize(1, { message: 'Pilih minimal satu tenda.' })
  @ArrayMaxSize(20, { message: 'Maksimal 20 unit per reservasi.' })
  @ValidateNested({ each: true })
  @Type(() => EditReservationItemInput)
  items?: EditReservationItemInput[];

  /** Harga gross baru (sebelum discount) — set jika admin ingin override. */
  @IsOptional()
  @IsInt({ message: MONEY_INT_MESSAGE })
  @Min(1, { message: 'Harga manual minimal Rp1.' })
  @Max(MAX_MONEY, { message: MONEY_MAX_MESSAGE })
  priceOverride?: number;

  @IsOptional()
  @IsInt({ message: MONEY_INT_MESSAGE })
  @Min(0, { message: 'Diskon tidak boleh negatif.' })
  @Max(MAX_MONEY, { message: MONEY_MAX_MESSAGE })
  discount?: number;

  /** Alasan perubahan — wajib diisi, minimal 3 karakter. */
  @Transform(trimString)
  @IsString({ message: NOTE_MESSAGE })
  @MinLength(3, { message: NOTE_MESSAGE })
  @MaxLength(300, { message: 'Alasan edit maksimal 300 karakter.' })
  note: string;
}
