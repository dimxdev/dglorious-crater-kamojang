import { Controller, Get } from '@nestjs/common';
import { SettingsService } from './settings.service';

/** Public read-only config — no auth, guests never log in (§4.4 PROJECT.md). */
@Controller('settings')
export class SettingsPublicController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAllPublic();
  }
}
