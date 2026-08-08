import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class AvailabilityQueryDto {
  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  /** ID booking yang sedang diedit — dikecualikan dari cek ketersediaan. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  excludeBookingId?: number;
}
