import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { RepositoryInfo, CommitInfo } from '../common/interfaces/commit.interface';
import { AnalysisResult } from '../analysis/analysis.service';

@Injectable()
export class GitLabCommentService {
  private readonly logger = new Logger(GitLabCommentService.name);
  private readonly gitlabToken: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.gitlabToken = this.configService.get<string>('GITLAB_TOKEN') || '';
    if (!this.gitlabToken) {
      this.logger.warn('GITLAB_TOKEN is not set');
    }

    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>('GITLAB_BASE_URL') || 'https://gitlab.com/api/v4',
      headers: {
        'PRIVATE-TOKEN': this.gitlabToken,
      },
      timeout: 30000,
    });
  }

  async postComment(
    repository: RepositoryInfo,
    commit: CommitInfo,
    analysis: AnalysisResult,
  ): Promise<void> {
    try {
      // GitLab 使用项目 ID 或路径
      const projectId = encodeURIComponent(repository.fullName);

      // 格式化评论内容
      const commentBody = this.formatComment(commit, analysis);

      // 创建 commit note
      await this.axiosInstance.post(
        `/projects/${projectId}/repository/commits/${commit.sha}/comments`,
        {
          note: commentBody,
        },
      );

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

