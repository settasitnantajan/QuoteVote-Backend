import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule], // Import UsersModule to use UsersService
  controllers: [WebhooksController],
})
export class WebhooksModule {}

