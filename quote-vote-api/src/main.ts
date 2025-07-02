import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';

let cachedServer: express.Express;

/**
 * Configures and initializes the NestJS application.
 * @param app The NestJS application instance.
 */
function configureApp(app: NestExpressApplication) {
  // It's crucial that CORS is enabled before other middleware.
  // The origin is determined by the FRONTEND_URL env var for production/preview,
  // falling back to localhost for local development.
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Allow frontend origin
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

  // Clerk authentication middleware.
  app.use(ClerkExpressWithAuth());
}

/**
 * Bootstraps the application.
 * For Vercel, it initializes the app and returns the express server instance.
 * For local development, it starts listening on a port.
 */
async function bootstrap() {
  if (!cachedServer) {
    const expressApp = express();
    const nestApp = await NestFactory.create<NestExpressApplication>(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    configureApp(nestApp);

    await nestApp.init();
    cachedServer = expressApp;
  }

  return cachedServer;
}
// Forcing a new deployment
// Check if running in a serverless environment like Vercel
if (process.env.VERCEL_ENV) {
  module.exports = async (req: express.Request, res: express.Response) => {
    const server = await bootstrap();
    server(req, res);
  };
} else {
  // Standard local development server setup
  bootstrap().then(() => {
    const port = process.env.PORT || 3001;
    cachedServer.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  });
}
