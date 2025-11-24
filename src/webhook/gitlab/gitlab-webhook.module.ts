import { Module } from '@nestjs/common';
import { GitLabWebhookController } from './gitlab-webhook.controller';
import { GitLabWebhookService } from './gitlab-webhook.service';

@Module({
  controllers: [GitLabWebhookController],
  providers: [GitLabWebhookService],
  exports: [GitLabWebhookService],
})
export class GitLabWebhookModule {}

