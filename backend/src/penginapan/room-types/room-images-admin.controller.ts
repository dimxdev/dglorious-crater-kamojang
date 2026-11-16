import {
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RoleName } from '../../generated/prisma/enums';
import { RoomTypesService } from './room-types.service';

/** Atur cover & hapus gambar tenda — khusus Super Admin. */
@Controller('admin/room-images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN)
export class RoomImagesAdminController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Patch(':id/cover')
  setCover(@Param('id', ParseIntPipe) id: number) {
    return this.roomTypesService.setCoverImage(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roomTypesService.removeImage(id);
  }
}
