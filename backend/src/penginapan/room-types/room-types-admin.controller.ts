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
  UseFilters,
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
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import {
  ImageTooLargeFilter,
  ROOM_IMAGE_UPLOAD_DIR,
  roomImageMulterOptions,
} from './room-image.multer';
import { RoomTypesService } from './room-types.service';

/**
 * CMS penginapan. Baca (list, detail, ketersediaan) terbuka untuk Super Admin,
 * Owner, dan Admin Penginapan; ubah data (tambah/ubah/hapus tipe + unggah
 * gambar) khusus Super Admin sejak revisi dospem 2026-11. `@Roles` di level
 * method menimpa level class (RolesGuard memakai getAllAndOverride).
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

  @Roles(RoleName.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateRoomTypeDto, @CurrentUser() user: AuthUser) {
    return this.roomTypesService.create(dto, user.id);
  }

  @Roles(RoleName.SUPER_ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.roomTypesService.update(id, dto);
  }

  @Roles(RoleName.SUPER_ADMIN)
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
    return this.roomTypesService.checkAvailability(
      id,
      checkIn,
      checkOut,
      query.excludeReservationId,
    );
  }

  @Roles(RoleName.SUPER_ADMIN)
  @Post(':id/images')
  @UseFilters(ImageTooLargeFilter)
  @UseInterceptors(FileInterceptor('file', roomImageMulterOptions))
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File gambar wajib diisi.');
    }
    return this.roomTypesService.addImage(
      id,
      `/${ROOM_IMAGE_UPLOAD_DIR}/${file.filename}`,
    );
  }
}
