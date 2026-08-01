import {
  Body,
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
import { UpdateRoomUnitDto } from './dto/room-unit.dto';
import { RoomTypesService } from './room-types.service';

@Controller('admin/room-units')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN, RoleName.OWNER, RoleName.ADMIN_PENGINAPAN)
export class RoomUnitsAdminController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomUnitDto,
  ) {
    return this.roomTypesService.updateUnit(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roomTypesService.removeUnit(id);
  }
}
