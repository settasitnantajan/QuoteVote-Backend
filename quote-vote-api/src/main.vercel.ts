// /Users/duke/Documents/GitHub/QuoteVote-Backend/quote-vote-api/src/main.vercel.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import * as express from 'express';

// สร้าง instance ของ express server เพื่อเก็บไว้ใช้ซ้ำ (caching)
// ช่วยลดเวลา cold start ในการเรียกครั้งถัดๆ ไป
const expressServer = express();
let isNestAppInitialized = false;

// ฟังก์ชันสำหรับ bootstrap NestJS application
const bootstrap = async () => {
  if (!isNestAppInitialized) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressServer),
    );

    // ตั้งค่า CORS ให้เหมือนกับ main.ts
    // แนะนำให้ใช้ Environment Variable สำหรับ Production
    // คุณสามารถตั้งค่า FRONTEND_URL ใน Vercel Dashboard
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    // ตั้งค่า Global Prefix
    app.setGlobalPrefix('api');

    // ตั้งค่า Global Pipes สำหรับ Validation
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // เพิ่ม Clerk middleware. This must be after CORS.
    app.use(ClerkExpressWithAuth());

    // app.init() จะเตรียม application ให้พร้อมใช้งาน แต่ยังไม่เริ่ม listen port
    await app.init();
    isNestAppInitialized = true;
  }
  return expressServer;
};

// Export default function ที่ Vercel จะเรียกใช้
// req และ res คือ request และ response object ของ Express
export default async (req: express.Request, res: express.Response) => {
  const server = await bootstrap();
  server(req, res);
};
