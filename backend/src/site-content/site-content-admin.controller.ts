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
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/jwt-payload';
import { RoleName } from '../generated/prisma/enums';
import {
  CreateItemDto,
  ListItemsQueryDto,
  ReorderItemsDto,
  UpdateItemDto,
  UpdateSectionDto,
} from './dto/site-content.dto';
import { SiteContentService } from './site-content.service';
import {
  SITE_IMAGE_UPLOAD_DIR,
  siteImageMulterOptions,
} from './site-content.multer';

/** CMS company profile — hanya Super Admin (revisi dospem 2026-11). */
@Controller('admin/site-content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPER_ADMIN)
export class SiteContentAdminController {
  constructor(private readonly service: SiteContentService) {}

  @Get('sections')
  listSections() {
    return this.service.listSections();
  }

  @Put('sections/:key')
  updateSection(
    @Param('key') key: string,
    @Body() dto: UpdateSectionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateSection(key, dto.content, user.id);
  }

  @Get('items')
  listItems(@Query() query: ListItemsQueryDto) {
    return this.service.listItems(query.collection);
  }

  @Post('items')
  createItem(@Body() dto: CreateItemDto, @CurrentUser() user: AuthUser) {
    return this.service.createItem(dto, user.id);
  }

  // Harus di atas `items/:id` supaya "reorder" tidak ditangkap sebagai id.
  @Put('items/reorder')
  reorder(@Body() dto: ReorderItemsDto, @CurrentUser() user: AuthUser) {
    return this.service.reorder(dto, user.id);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateItem(id, dto, user.id);
  }

  @Delete('items/:id')
  deleteItem(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteItem(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', siteImageMulterOptions))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File gambar wajib diisi');
    }
    return { url: `/${SITE_IMAGE_UPLOAD_DIR}/${file.filename}` };
  }
}
