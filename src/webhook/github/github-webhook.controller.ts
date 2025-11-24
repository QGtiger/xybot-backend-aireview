import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from '../webhook.service';
import { GitHubWebhookService } from './github-webhook.service';

@Controller('webhook/github')
export class GitHubWebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly githubWebhookService: GitHubWebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
  ) {
    // 验证签名
    const webhookSecret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');
    if (webhookSecret) {
      const isValid = this.githubWebhookService.verifySignature(
        JSON.stringify(body),
        signature,
        webhookSecret,
      );
      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    // 只处理 push 事件
    if (event !== 'push') {
      return { message: 'Event ignored', event };
    }

    // 处理 push 事件
    await this.webhookService.handlePushEvent(body, 'github');

    return { message: 'Webhook processed successfully' };
  }
}

