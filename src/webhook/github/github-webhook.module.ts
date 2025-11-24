import { Module } from '@nestjs/common';
import { GitHubWebhookController } from './github-webhook.controller';
import { GitHubWebhookService } from './github-webhook.service';

@Module({
  controllers: [GitHubWebhookController],
  providers: [GitHubWebhookService],
  exports: [GitHubWebhookService],
})
export class GitHubWebhookModule {}

