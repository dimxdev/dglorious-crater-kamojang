import { IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @IsObject({ message: 'values wajib berupa objek { key: nilai }' })
  values!: Record<string, unknown>;
}
