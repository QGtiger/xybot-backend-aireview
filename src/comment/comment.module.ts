import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { GitHubCommentService } from './github-comment.service';
import { GitLabCommentService } from './gitlab-comment.service';

@Module({
  providers: [CommentService, GitHubCommentService, GitLabCommentService],
  exports: [CommentService],
})
export class CommentModule {}

