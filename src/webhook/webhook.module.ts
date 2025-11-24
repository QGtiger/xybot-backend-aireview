import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { GitHubWebhookModule } from './github/github-webhook.module';
import { GitLabWebhookModule } from './gitlab/gitlab-webhook.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [
    GitHubWebhookModule,
    GitLabWebhookModule,
    AnalysisModule,
    CommentModule,
  ],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}

