import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthUser } from '../../auth/types/jwt-payload';
import { RoleName } from '../../generated/prisma/enums';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { CreateRoomUnitDto } from './dto/room-unit.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import {
  ROOM_IMAGE_UPLOAD_DIR,
  roomImageMulterOptions,
} from './room-image.multer';
import { RoomTypesService } from './room-types.service';

/**
 * CMS penginapan (§8.1 FASE 5 TASK.md). Owner & Super Admin bisa turun ke
 * dashboard admin (§5 PROJECT.md); Admin Penginapan CRUD penuh di area ini.
 */
@Controller('admin/room-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN, RoleName.OWNER, RoleName.ADMIN_PENGINAPAN)
export class RoomTypesAdminController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Get()
  findAll() {
    return this.roomTypesService.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomTypesService.findOneAdminOrThrow(id);
  }

  @Post()
  create(@Body() dto: CreateRoomTypeDto, @CurrentUser() user: AuthUser) {
    return this.roomTypesService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.roomTypesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roomTypesService.softDelete(id);
  }

  @Get(':id/availability')
  checkAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: AvailabilityQueryDto,
  ) {
    const checkIn = new Date(query.checkIn);
    const checkOut = new Date(query.checkOut);
    return this.roomTypesService.checkAvailability(id, checkIn, checkOut);
  }

  @Post(':id/units')
  addUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateRoomUnitDto,
  ) {
    return this.roomTypesService.addUnit(id, dto);
  }

  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file', roomImageMulterOptions))
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File gambar wajib diisi');
    }
    return this.roomTypesService.addImage(
      id,
      `/${ROOM_IMAGE_UPLOAD_DIR}/${file.filename}`,
    );
  }
}
