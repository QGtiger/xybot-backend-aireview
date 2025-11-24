import { Injectable, Logger } from '@nestjs/common';
import { GitHubWebhookService } from './github/github-webhook.service';
import { GitLabWebhookService } from './gitlab/gitlab-webhook.service';
import { AnalysisService } from '../analysis/analysis.service';
import { CommentService } from '../comment/comment.service';
import { CommitInfo } from '../common/interfaces/commit.interface';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly githubWebhookService: GitHubWebhookService,
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
          // GitHub push 事件的 payload 在顶层有 commits 数组
          // 但文件变更信息需要从 payload 的其他字段获取
          // 注意：GitHub push 事件可能不包含完整的文件变更列表
          // 实际应用中可能需要调用 GitHub API 获取 commit diff
          const commitData = payload.commits?.find((c: any) => c.id === commit.sha);
          if (commitData) {
            // GitHub payload 可能包含 added, removed, modified 数组
            const allFiles = [
              ...(payload.added || []).map((f: string) => ({ filename: f, status: 'added' })),
              ...(payload.modified || []).map((f: string) => ({ filename: f, status: 'modified' })),
              ...(payload.removed || []).map((f: string) => ({ filename: f, status: 'removed' })),
            ];
            files = this.githubWebhookService.parseFileChanges(allFiles);
            diff = this.buildDiffFromFiles(files);
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

