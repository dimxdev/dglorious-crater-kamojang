import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class EditBookingItemInput {
  @IsNumber()
  roomTypeId: number;

  @IsNumber()
  @Min(1)
  adults: number;

  @IsNumber()
  @Min(0)
  children: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extraBedQty?: number;

  @IsOptional()
  @IsEnum(['WITH_BED', 'WITHOUT_BED'])
  extraBedType?: 'WITH_BED' | 'WITHOUT_BED';
}

export class EditBookingDto {
  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditBookingItemInput)
  items?: EditBookingItemInput[];

  /** Harga gross baru (sebelum discount) — set jika admin ingin override. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOverride?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  /** Alasan perubahan — wajib diisi, minimal 3 karakter. */
  @IsString()
  @MinLength(3, { message: 'Alasan edit wajib diisi (minimal 3 karakter)' })
  note: string;
}
