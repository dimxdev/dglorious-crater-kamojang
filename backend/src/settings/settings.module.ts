import { Module } from '@nestjs/common';
import { SettingsPublicController } from './settings-public.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsPublicController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
