import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DEFAULT_ALLOWED_ORIGINS } from './common/tcx.constants';
import { TcxExceptionFilter } from './common/tcx-exception.filter';
import { TcxResponseInterceptor } from './common/tcx-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) ??
    DEFAULT_ALLOWED_ORIGINS
  ).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: false }),
  );
  app.useGlobalFilters(new TcxExceptionFilter());
  app.useGlobalInterceptors(new TcxResponseInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
