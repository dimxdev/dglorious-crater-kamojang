import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReservationsModule } from './penginapan/reservations/reservations.module';
import { RoomTypesModule } from './penginapan/room-types/room-types.module';
import { SettingsModule } from './settings/settings.module';
import { SiteContentModule } from './site-content/site-content.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Loads .env and makes ConfigService available everywhere.
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RoomTypesModule,
    SettingsModule,
    ReservationsModule,
    SiteContentModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
