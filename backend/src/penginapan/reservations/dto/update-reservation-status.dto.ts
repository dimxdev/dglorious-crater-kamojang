import { IsIn } from 'class-validator';

/** DP is the only status never reachable via PATCH — it's set at creation time. */
export class UpdateReservationStatusDto {
  @IsIn(['LUNAS', 'CHECKED_IN', 'HANGUS', 'COMPLETED', 'NO_SHOW'], {
    message: 'Status tidak valid.',
  })
  status: 'LUNAS' | 'CHECKED_IN' | 'HANGUS' | 'COMPLETED' | 'NO_SHOW';
}
