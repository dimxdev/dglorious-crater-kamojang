import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ContentCollection } from '../../generated/prisma/enums';

// Isi `content` divalidasi manual di content-schemas.ts (bentuknya beda per key/koleksi).

export class UpdateSectionDto {
  @IsObject({ message: 'content wajib berupa objek' })
  content!: Record<string, unknown>;
}

export class ListItemsQueryDto {
  @IsEnum(ContentCollection, { message: 'collection tidak valid' })
  collection!: ContentCollection;
}

export class CreateItemDto {
  @IsEnum(ContentCollection, { message: 'collection tidak valid' })
  collection!: ContentCollection;

  @IsObject({ message: 'content wajib berupa objek' })
  content!: Record<string, unknown>;

  @IsOptional()
  @IsString({ message: 'imageUrl harus berupa teks' })
  @MaxLength(500, { message: 'imageUrl maksimal 500 karakter' })
  imageUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive harus berupa true/false' })
  isActive?: boolean;
}

export class UpdateItemDto {
  @IsOptional()
  @IsObject({ message: 'content wajib berupa objek' })
  content?: Record<string, unknown>;

  // null atau "" = hapus gambar
  @IsOptional()
  @IsString({ message: 'imageUrl harus berupa teks' })
  @MaxLength(500, { message: 'imageUrl maksimal 500 karakter' })
  imageUrl?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'isActive harus berupa true/false' })
  isActive?: boolean;
}

export class ReorderItemsDto {
  @IsEnum(ContentCollection, { message: 'collection tidak valid' })
  collection!: ContentCollection;

  @IsArray({ message: 'ids harus berupa daftar' })
  @ArrayNotEmpty({ message: 'ids tidak boleh kosong' })
  @Type(() => Number)
  @IsInt({ each: true, message: 'ids harus berupa bilangan bulat' })
  ids!: number[];
}
