import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RoomUnitStatus } from '../../../generated/prisma/enums';

export class CreateRoomUnitDto {
  @IsString()
  @IsNotEmpty()
  unitCode: string;

  @IsOptional()
  @IsEnum(RoomUnitStatus)
  status?: RoomUnitStatus;
}

export class UpdateRoomUnitDto {
  @IsOptional()
  @IsEnum(RoomUnitStatus)
  status?: RoomUnitStatus;
}
