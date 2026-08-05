import { IsIn } from 'class-validator';

/** DP is the only status never reachable via PATCH — it's set at creation time. */
export class UpdateBookingStatusDto {
  @IsIn(['LUNAS', 'CHECKED_IN', 'HANGUS', 'COMPLETED', 'NO_SHOW'])
  status: 'LUNAS' | 'CHECKED_IN' | 'HANGUS' | 'COMPLETED' | 'NO_SHOW';
}
