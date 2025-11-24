import { Module } from '@nestjs/common';
import { GitHubWebhookController } from './github-webhook.controller';
import { GitHubWebhookService } from './github-webhook.service';
import { GitHubApiService } from './github-api.service';

@Module({
  controllers: [GitHubWebhookController],
  providers: [GitHubWebhookService, GitHubApiService],
  exports: [GitHubWebhookService, GitHubApiService],
})
export class GitHubWebhookModule {}
