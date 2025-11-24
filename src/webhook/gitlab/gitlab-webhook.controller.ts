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
import { GitLabWebhookService } from './gitlab-webhook.service';

@Controller('webhook/gitlab')
export class GitLabWebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly gitlabWebhookService: GitLabWebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('x-gitlab-token') token: string,
    @Headers('x-gitlab-event') event: string,
  ) {
    // 验证 token
    const webhookToken = this.configService.get<string>('GITLAB_WEBHOOK_TOKEN');
    if (webhookToken && token !== webhookToken) {
      throw new BadRequestException('Invalid webhook token');
    }

    // 只处理 Push Hook 事件
    if (event !== 'Push Hook') {
      return { message: 'Event ignored', event };
    }

    // 处理 push 事件
    await this.webhookService.handlePushEvent(body, 'gitlab');

    return { message: 'Webhook processed successfully' };
  }
}

