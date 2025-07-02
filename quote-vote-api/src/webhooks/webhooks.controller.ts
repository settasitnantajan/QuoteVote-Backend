import { Controller, Post, Req, Headers, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { Webhook } from 'svix';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

// This is a simplified representation of the Clerk webhook payload
interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated';
  data: {
    id: string;
    first_name: string;
    last_name: string;
    image_url: string;
  };
}

@Controller('webhooks')
export class WebhooksController {
  // Get your webhook secret from the Clerk Dashboard -> Webhooks -> Your Endpoint
  private readonly CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  constructor(private readonly usersService: UsersService) {}

  @Post('clerk')
  async handleClerkWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!this.CLERK_WEBHOOK_SECRET) {
      throw new Error('CLERK_WEBHOOK_SECRET is not set in environment variables.');
    }
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing Svix headers');
    }

    if (!req.rawBody) {
      throw new BadRequestException('Request body is missing.');
    }

    const wh = new Webhook(this.CLERK_WEBHOOK_SECRET);
    let event: ClerkWebhookEvent;

    try {
      event = wh.verify(req.rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      throw new BadRequestException('Webhook signature verification failed.');
    }

    const { type, data } = event;
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();

    if (type === 'user.created' || type === 'user.updated') {
      await this.usersService.upsertUser(data.id, fullName, data.image_url);
    }

    return { status: 'success' };
  }
}
