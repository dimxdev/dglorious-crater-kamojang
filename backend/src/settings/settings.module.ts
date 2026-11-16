import { Module } from '@nestjs/common';
import { SettingsAdminController } from './settings-admin.controller';
import { SettingsPublicController } from './settings-public.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsPublicController, SettingsAdminController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
