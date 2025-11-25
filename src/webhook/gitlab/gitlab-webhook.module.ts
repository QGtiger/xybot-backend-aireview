import { Module } from '@nestjs/common';
import { GitLabWebhookController } from './gitlab-webhook.controller';
import { GitLabWebhookService } from './gitlab-webhook.service';
import { GitLabApiService } from './gitlab-api.service';

@Module({
  controllers: [GitLabWebhookController],
  providers: [GitLabWebhookService, GitLabApiService],
  exports: [GitLabWebhookService, GitLabApiService],
})
export class GitLabWebhookModule {}

