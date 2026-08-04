import { Module } from '@nestjs/common';
import { RoomTypesModule } from '../room-types/room-types.module';
import { BookingsAdminController } from './bookings-admin.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [RoomTypesModule], // butuh RoomTypesService.checkAvailability (FASE 5)
  controllers: [BookingsAdminController],
  providers: [BookingsService],
})
export class BookingsModule {}
