import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import type { AuthUser } from '../../auth/types/jwt-payload';
import { RoleName } from '../../generated/prisma/enums';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { EditReservationDto } from './dto/edit-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

/**
 * Pencatatan reservation internal (§6.1 PROJECT.md). Ubah data khusus Admin
 * Penginapan; baca (list/detail) juga untuk Owner (dashboard, read-only).
 * Super Admin tidak punya akses reservation. `@Roles` method menimpa class.
 */
@Controller('admin/reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN_PENGINAPAN)
export class ReservationsAdminController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: AuthUser) {
    return this.reservationsService.create(dto, user.id);
  }

  @Roles(RoleName.OWNER, RoleName.ADMIN_PENGINAPAN)
  @Get()
  findAll() {
    return this.reservationsService.findAllAdmin();
  }

  @Roles(RoleName.OWNER, RoleName.ADMIN_PENGINAPAN)
  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.reservationsService.findByCodeOrThrow(code);
  }

  @Patch(':code/status')
  updateStatus(
    @Param('code') code: string,
    @Body() dto: UpdateReservationStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reservationsService.updateStatus(code, dto, user.id);
  }

  @Patch(':code')
  editReservation(
    @Param('code') code: string,
    @Body() dto: EditReservationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reservationsService.editReservation(code, dto, user.id);
  }
}
