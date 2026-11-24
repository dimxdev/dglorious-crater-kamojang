import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ReservationChannel, PaymentMethod } from '../../../generated/prisma/enums';
import { normalizeIdPhone, PHONE_MESSAGE, PHONE_REGEX } from '../../../common/phone';
import {
  IsRealDate,
  MAX_MONEY,
  MONEY_INT_MESSAGE,
  MONEY_MAX_MESSAGE,
  trimString,
} from '../stay-validation.util';
import { CreateReservationItemDto } from './create-reservation-item.dto';

export class CreateReservationDto {
  @Transform(trimString)
  @IsString({ message: 'Nama tamu wajib diisi.' })
  @IsNotEmpty({ message: 'Nama tamu wajib diisi.' })
  @MaxLength(100, { message: 'Nama tamu maksimal 100 karakter.' })
  guestName: string;

  @Transform(({ value }) => normalizeIdPhone(value))
  @IsString({ message: PHONE_MESSAGE })
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  guestPhone: string;

  @IsRealDate()
  checkIn: string;

  @IsRealDate()
  checkOut: string;

  @IsEnum(ReservationChannel, { message: 'Kanal reservasi tidak valid.' })
  channel: ReservationChannel;

  /** Wajib untuk RESERVASI (admin pilih sesuai kondisi saat itu, §8.1) — diabaikan
   *  untuk LANGSUNG, status-nya dipaksa CHECKED_IN di service (§6.1). */
  @ValidateIf(
    (o: CreateReservationDto) => o.channel === ReservationChannel.RESERVASI,
  )
  @IsIn(['DP', 'LUNAS'], {
    message: 'Status pembayaran awal harus DP atau LUNAS.',
  })
  initialStatus?: 'DP' | 'LUNAS';

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'Catatan tidak valid.' })
  @MaxLength(500, { message: 'Catatan maksimal 500 karakter.' })
  notes?: string;

  @IsOptional()
  @IsBoolean({ message: 'Penanda harga manual tidak valid.' })
  isPriceOverride?: boolean;

  @ValidateIf((o: CreateReservationDto) => o.isPriceOverride === true)
  @IsInt({ message: MONEY_INT_MESSAGE })
  @Min(1, { message: 'Harga manual minimal Rp1.' })
  @Max(MAX_MONEY, { message: MONEY_MAX_MESSAGE })
  manualTotal?: number;

  /** Potongan nominal opsional (bukan persen) — dikurangi dari total (otomatis
   *  ATAU `manualTotal` kalau `isPriceOverride`) sebelum dibekukan jadi `priceSnapshot`. */
  @IsOptional()
  @IsInt({ message: MONEY_INT_MESSAGE })
  @Min(0, { message: 'Diskon tidak boleh negatif.' })
  @Max(MAX_MONEY, { message: MONEY_MAX_MESSAGE })
  discount?: number;

  /** Wajib untuk LANGSUNG — dipakai bikin baris `Payment` (§ "gunakan tabel yang sudah ada"). */
  @ValidateIf(
    (o: CreateReservationDto) => o.channel === ReservationChannel.LANGSUNG,
  )
  @IsEnum(PaymentMethod, { message: 'Metode pembayaran tidak valid.' })
  payMethod?: PaymentMethod;

  /**
   * Nominal DP yang sudah diterima admin (transfer ke rekening, di luar sistem)
   * — wajib untuk RESERVASI + status DP. S&K bilang DP 50%, tapi nego bisa beda,
   * jadi diisi manual, bukan dihitung otomatis dari total. Dipakai bikin baris
   * `Payment` pertama reservation ini.
   */
  @ValidateIf(
    (o: CreateReservationDto) =>
      o.channel === ReservationChannel.RESERVASI && o.initialStatus === 'DP',
  )
  @IsInt({ message: MONEY_INT_MESSAGE })
  @Min(1, { message: 'Nominal DP minimal Rp1.' })
  @Max(MAX_MONEY, { message: MONEY_MAX_MESSAGE })
  paidAmount?: number;

  @IsArray({ message: 'Pilih minimal satu tenda.' })
  @ArrayMinSize(1, { message: 'Pilih minimal satu tenda.' })
  @ArrayMaxSize(20, { message: 'Maksimal 20 unit per reservasi.' })
  @ValidateNested({ each: true })
  @Type(() => CreateReservationItemDto)
  items: CreateReservationItemDto[];
}
