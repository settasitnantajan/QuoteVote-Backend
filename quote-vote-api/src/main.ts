import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'https://quote-vote-nu.vercel.app/', // Allow frontend origin
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Add Clerk middleware. This must be after CORS.
  app.use(ClerkExpressWithAuth());

  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
