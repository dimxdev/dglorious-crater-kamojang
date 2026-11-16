import { Controller, Get } from '@nestjs/common';
import { SiteContentService } from './site-content.service';

/** Konten company profile untuk halaman publik — tanpa auth. */
@Controller('site-content')
export class SiteContentPublicController {
  constructor(private readonly service: SiteContentService) {}

  @Get()
  findAll() {
    return this.service.findAllPublic();
  }
}
