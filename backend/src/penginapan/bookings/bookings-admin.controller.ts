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
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { EditBookingDto } from './dto/edit-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

/** Pencatatan booking internal (§6.1 PROJECT.md) — admin hanya input booking yang sudah fix. */
@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN, RoleName.OWNER, RoleName.ADMIN_PENGINAPAN)
export class BookingsAdminController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: AuthUser) {
    return this.bookingsService.create(dto, user.id);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAllAdmin();
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.bookingsService.findByCodeOrThrow(code);
  }

  @Patch(':code/status')
  updateStatus(
    @Param('code') code: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.updateStatus(code, dto, user.id);
  }

  @Patch(':code')
  editBooking(
    @Param('code') code: string,
    @Body() dto: EditBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookingsService.editBooking(code, dto, user.id);
  }
}
