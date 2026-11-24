import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

/** Ratakan error validasi bersarang menjadi daftar pesan tanpa awalan path. */
function collectMessages(errors: ValidationError[]): string[] {
  const out: string[] = [];
  for (const e of errors) {
    for (const [rule, msg] of Object.entries(e.constraints ?? {})) {
      out.push(
        rule === 'whitelistValidation'
          ? `Isian "${e.property}" tidak dikenal.`
          : msg,
      );
    }
    if (e.children?.length) out.push(...collectMessages(e.children));
  }
  return [...new Set(out)];
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Uploaded room images (local disk — 1-VPS deploy, §12 PROJECT.md).
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // Only allow the frontend origin to call the API.
  app.enableCors({
    origin: config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000',
    credentials: true,
  });

  // All DTOs are validated globally (project rule: class-validator on every input).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Pesan dikirim apa adanya (tanpa awalan path seperti "items.0."),
      // supaya yang tampil ke pengguna hanya kalimat berbahasa Indonesia.
      exceptionFactory: (errors) =>
        new BadRequestException(collectMessages(errors)),
    }),
  );

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
void bootstrap();
