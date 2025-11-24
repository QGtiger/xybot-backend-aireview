import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { RepositoryInfo, CommitInfo } from '../common/interfaces/commit.interface';
import { AnalysisResult } from '../analysis/analysis.service';

@Injectable()
export class GitHubCommentService {
  private readonly logger = new Logger(GitHubCommentService.name);
  private readonly octokit: Octokit;

  constructor(private readonly configService: ConfigService) {
    const githubToken = this.configService.get<string>('GITHUB_TOKEN');
    if (!githubToken) {
      this.logger.warn('GITHUB_TOKEN is not set');
    }

    this.octokit = new Octokit({
      auth: githubToken,
    });
  }

  async postComment(
    repository: RepositoryInfo,
    commit: CommitInfo,
    analysis: AnalysisResult,
  ): Promise<void> {
    try {
      const [owner, repo] = repository.fullName.split('/');

      // 格式化评论内容
      const commentBody = this.formatComment(commit, analysis);

      // 创建 commit comment
      await this.octokit.repos.createCommitComment({
        owner,
        repo,
        commit_sha: commit.sha,
        body: commentBody,
      });

      this.logger.log(`Comment posted for commit ${commit.sha} in ${repository.fullName}`);
    } catch (error: any) {
      this.logger.error(`Failed to post comment for commit ${commit.sha}:`, error.message);
      throw error;
    }
  }

  private formatComment(commit: CommitInfo, analysis: AnalysisResult): string {
    return `## 🤖 AI Code Review

**提交**: \`${commit.sha.substring(0, 7)}\`  
**作者**: ${commit.author.name}  
**提交信息**: ${commit.message}

---

### 📊 复杂度分析
${analysis.complexity}

### ✅ 可行性评估
${analysis.feasibility}

### 🔒 安全性检查
${analysis.security}

### 📝 总体评价
${analysis.overall}

---

*此评论由 AI Review 系统自动生成*
`;
  }
}

