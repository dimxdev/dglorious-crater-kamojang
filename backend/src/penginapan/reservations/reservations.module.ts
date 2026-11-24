import { Module } from '@nestjs/common';
import { RoomTypesModule } from '../room-types/room-types.module';
import { ReservationsAdminController } from './reservations-admin.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [RoomTypesModule], // butuh RoomTypesService.checkAvailability (FASE 5)
  controllers: [ReservationsAdminController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
