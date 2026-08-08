import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { BookingChannel, PaymentMethod } from '../../../generated/prisma/enums';
import { CreateBookingItemDto } from './create-booking-item.dto';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  guestName: string;

  @IsString()
  @IsNotEmpty()
  guestPhone: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsEnum(BookingChannel)
  bookingChannel: BookingChannel;

  /** Wajib untuk WHATSAPP (admin pilih sesuai kondisi saat itu, §8.1) — diabaikan
   *  untuk WALK_IN, status-nya dipaksa CHECKED_IN di service (§6.1). */
  @ValidateIf(
    (o: CreateBookingDto) => o.bookingChannel === BookingChannel.WHATSAPP,
  )
  @IsIn(['DP', 'LUNAS'])
  initialStatus?: 'DP' | 'LUNAS';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isPriceOverride?: boolean;

  @ValidateIf((o: CreateBookingDto) => o.isPriceOverride === true)
  @IsNumber()
  @Min(0)
  manualTotal?: number;

  /** Potongan nominal opsional (bukan persen) — dikurangi dari total (otomatis
   *  ATAU `manualTotal` kalau `isPriceOverride`) sebelum dibekukan jadi `priceSnapshot`. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  /** Wajib untuk WALK_IN — dipakai bikin baris `Payment` (§ "gunakan tabel yang sudah ada"). */
  @ValidateIf(
    (o: CreateBookingDto) => o.bookingChannel === BookingChannel.WALK_IN,
  )
  @IsEnum(PaymentMethod)
  payMethod?: PaymentMethod;

  /**
   * Nominal DP yang sudah diterima admin (transfer ke rekening, di luar sistem)
   * — wajib untuk WHATSAPP + status DP. S&K bilang DP 50%, tapi nego bisa beda,
   * jadi diisi manual, bukan dihitung otomatis dari total. Dipakai bikin baris
   * `Payment` pertama booking ini.
   */
  @ValidateIf(
    (o: CreateBookingDto) =>
      o.bookingChannel === BookingChannel.WHATSAPP && o.initialStatus === 'DP',
  )
  @IsNumber()
  @Min(1)
  paidAmount?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBookingItemDto)
  items: CreateBookingItemDto[];
}
