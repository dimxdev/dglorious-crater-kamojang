import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * One facility entry with its own inline per-language label — chosen over a
 * separate keys+lookup-table design because the admin CMS form
 * (`FacilityListEditor.tsx`) already edits icon+label pairs directly per
 * language, with no separate facility dictionary anywhere in the app.
 */
export class FacilityLabelDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsString()
  en?: string;
}

export class FacilityDto {
  /** Lucide icon name (frontend/lib/icons.ts). Not validated against that
   *  list here — keeping backend decoupled from a frontend-only registry. */
  @IsString()
  @IsNotEmpty()
  icon: string;

  @ValidateNested()
  @Type(() => FacilityLabelDto)
  label: FacilityLabelDto;
}
