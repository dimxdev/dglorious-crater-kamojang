import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ExtraBedType } from '../../../generated/prisma/enums';

/** One tent/villa within a reservation — dewasa/anak/extra-bed per unit (§8.2 PROJECT.md). */
export class CreateReservationItemDto {
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
  @IsEnum(ExtraBedType, { message: 'Jenis extra bed tidak valid.' })
  extraBedType?: ExtraBedType;
}
