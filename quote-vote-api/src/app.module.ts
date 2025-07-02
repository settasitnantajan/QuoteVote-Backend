import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuotesModule } from './quotes/quotes.module';
import { createClerkClient } from '@clerk/clerk-sdk-node';

@Module({
  imports: [
    // It's recommended to use a configuration service for your connection string
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available throughout the app
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    QuotesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'CLERK_CLIENT',
      useFactory: (configService: ConfigService) => {
        return createClerkClient({
          secretKey: configService.get<string>('CLERK_SECRET_KEY'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['CLERK_CLIENT'],
})
export class AppModule {}