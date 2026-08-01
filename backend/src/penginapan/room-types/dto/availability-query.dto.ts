import { IsDateString } from 'class-validator';

export class AvailabilityQueryDto {
  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;
}
