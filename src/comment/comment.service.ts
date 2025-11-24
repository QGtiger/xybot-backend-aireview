import { Injectable, Logger } from '@nestjs/common';
import { GitHubCommentService } from './github-comment.service';
import { GitLabCommentService } from './gitlab-comment.service';
import { RepositoryInfo, CommitInfo } from '../common/interfaces/commit.interface';
import { AnalysisResult } from '../analysis/analysis.service';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    private readonly githubCommentService: GitHubCommentService,
    private readonly gitlabCommentService: GitLabCommentService,
  ) {}

  async postComment(
    repository: RepositoryInfo,
    commit: CommitInfo,
    analysis: AnalysisResult,
  ): Promise<void> {
    try {
      if (repository.platform === 'github') {
        await this.githubCommentService.postComment(repository, commit, analysis);
      } else if (repository.platform === 'gitlab') {
        await this.gitlabCommentService.postComment(repository, commit, analysis);
      } else {
        throw new Error(`Unsupported platform: ${repository.platform}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to post comment:`, error.message);
      throw error;
    }
  }
}

