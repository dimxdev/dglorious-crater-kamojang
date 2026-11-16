import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleName } from '../generated/prisma/enums';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsService } from './settings.service';

/** Pengaturan umum (jam operasional, no. WA, rekening, S&K) — hanya Super Admin. */
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN)
export class SettingsAdminController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAllPublic();
  }

  @Put()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateMany(dto.values);
  }
}
