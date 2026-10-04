import { Module } from '@nestjs/common';
import { RoomImagesAdminController } from './room-images-admin.controller';
import { RoomTypesAdminController } from './room-types-admin.controller';
import { RoomTypesPublicController } from './room-types-public.controller';
import { RoomTypesService } from './room-types.service';

@Module({
  controllers: [
    RoomTypesPublicController,
    RoomTypesAdminController,
    RoomImagesAdminController,
  ],
  providers: [RoomTypesService],
  // Exported so BookingsModule (FASE 7) can reuse checkAvailability/calcStayTotal.
  exports: [RoomTypesService],
})
export class RoomTypesModule {}
