import { Injectable, Logger } from '@nestjs/common';
import { GitHubWebhookService } from './github/github-webhook.service';
import { GitHubApiService } from './github/github-api.service';
import { GitLabWebhookService } from './gitlab/gitlab-webhook.service';
import { AnalysisService } from '../analysis/analysis.service';
import { CommentService } from '../comment/comment.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly githubWebhookService: GitHubWebhookService,
    private readonly githubApiService: GitHubApiService,
    private readonly gitlabWebhookService: GitLabWebhookService,
    private readonly analysisService: AnalysisService,
    private readonly commentService: CommentService,
  ) {}

  async handlePushEvent(payload: any, platform: 'github' | 'gitlab') {
    this.logger.log(`Processing ${platform} push event`);

    // 解析事件
    const parsed = platform === 'github'
      ? this.githubWebhookService.parsePushEvent(payload)
      : this.gitlabWebhookService.parsePushEvent(payload);

    // 处理每个 commit
    for (const commit of parsed.commits) {
      try {
        // 从 payload 中提取当前 commit 的文件变更
        let files: any[] = [];
        let diff = '';

        if (platform === 'github') {
          // GitHub webhook payload 只包含文件名，不包含实际的 diff
          // 需要调用 GitHub API 获取完整的 commit diff
          try {
            const [owner, repo] = parsed.repository.fullName.split('/');
            const commitDiff = await this.githubApiService.getCommitDiff(
              owner,
              repo,
              commit.sha,
            );
            diff = commitDiff.diff;
            files = commitDiff.files;
            this.logger.log(
              `Retrieved diff for commit ${commit.sha}, ${files.length} files changed`,
            );
          } catch (error: any) {
            this.logger.warn(
              `Failed to get commit diff from API for ${commit.sha}, using fallback: ${error.message}`,
            );
            // 降级方案：从 payload 中提取文件名
            const commitData = payload.commits?.find((c: any) => c.id === commit.sha);
            if (commitData) {
              const allFiles = [
                ...(commitData.added || []).map((f: string) => ({
                  filename: f,
                  status: 'added',
                })),
                ...(commitData.modified || []).map((f: string) => ({
                  filename: f,
                  status: 'modified',
                })),
                ...(commitData.removed || []).map((f: string) => ({
                  filename: f,
                  status: 'removed',
                })),
              ];
              files = this.githubWebhookService.parseFileChanges(allFiles);
              diff = this.buildDiffFromFiles(files);
            }
          }
        } else {
          // GitLab
          const commitData = payload.commits?.find((c: any) => c.id === commit.sha);
          if (commitData && commitData.modified) {
            files = this.gitlabWebhookService.parseFileChanges(commitData.modified);
            diff = this.buildDiffFromFiles(files);
          }
        }

        commit.diff = diff;
        commit.files = files;

        // 进行 AI 分析
        const analysis = await this.analysisService.analyzeCommit(commit);

        // 提交评论
        await this.commentService.postComment(parsed.repository, commit, analysis);
      } catch (error) {
        this.logger.error(`Error processing commit ${commit.sha}:`, error);
      }
    }
  }

  private buildDiffFromFiles(files: any[]): string {
    return files
      .map((file) => {
        if (file.patch) {
          return `文件: ${file.filename}\n${file.patch}`;
        }
        return `文件: ${file.filename} (${file.status})`;
      })
      .join('\n\n');
  }
}

