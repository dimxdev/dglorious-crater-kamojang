import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { FacilityDto } from './facility.dto';
import { RoomTypeTranslationsDto } from './translation.dto';

export class CreateRoomTypeDto {
  /** URL-safe identifier, e.g. "eagle-hill". Immutable after creation. */
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug hanya boleh huruf kecil, angka, dan tanda hubung',
  })
  slug: string;

  @IsNumber()
  @Min(0)
  priceWeekday: number;

  @IsNumber()
  @Min(0)
  priceWeekend: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsInt()
  @Min(0)
  totalUnits: number;

  /** §"KETENTUAN PENAMBAHAN ORANG" (PROJECT.md §11) — with/without extra bed. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraBedPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extraNoBedPrice?: number;

  /** Flat per-person rate — only Glorious Campervan uses this. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  extraFlatPrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacilityDto)
  facilities: FacilityDto[];

  @IsDefined()
  @ValidateNested()
  @Type(() => RoomTypeTranslationsDto)
  translations: RoomTypeTranslationsDto;
}
