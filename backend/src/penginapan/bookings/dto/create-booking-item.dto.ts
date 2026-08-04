import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ExtraBedType } from '../../../generated/prisma/enums';

/** One tent/villa within a booking — dewasa/anak/extra-bed per unit (§8.2 PROJECT.md). */
export class CreateBookingItemDto {
  @IsInt()
  roomTypeId: number;

  @IsInt()
  @Min(1)
  adults: number;

  @IsInt()
  @Min(0)
  children: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  extraBedQty?: number;

  @IsOptional()
  @IsEnum(ExtraBedType)
  extraBedType?: ExtraBedType;
}
