import { Module } from '@nestjs/common';
import { SiteContentAdminController } from './site-content-admin.controller';
import { SiteContentPublicController } from './site-content-public.controller';
import { SiteContentService } from './site-content.service';

@Module({
  controllers: [SiteContentPublicController, SiteContentAdminController],
  providers: [SiteContentService],
})
export class SiteContentModule {}
