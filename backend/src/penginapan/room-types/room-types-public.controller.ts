import { Controller, Get, Param, Query } from '@nestjs/common';
import { RoomTypesService } from './room-types.service';

function normalizeLang(lang?: string): 'ID' | 'EN' {
  return lang?.toUpperCase() === 'EN' ? 'EN' : 'ID';
}

/**
 * Public catalog — no auth (§4.4 PROJECT.md, guests never log in).
 * Only active, non-deleted room types are ever returned here.
 */
@Controller('room-types')
export class RoomTypesPublicController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Get()
  findAll(@Query('lang') lang?: string) {
    return this.roomTypesService.findAllPublic(normalizeLang(lang));
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @Query('lang') lang?: string) {
    return this.roomTypesService.findPublicBySlugOrThrow(
      slug,
      normalizeLang(lang),
    );
  }
}
