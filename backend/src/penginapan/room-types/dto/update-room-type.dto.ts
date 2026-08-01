import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateRoomTypeDto } from './create-room-type.dto';

/** Slug is immutable after creation (it's the public URL) — omitted, not just optional. */
export class UpdateRoomTypeDto extends PartialType(
  OmitType(CreateRoomTypeDto, ['slug'] as const),
) {}
