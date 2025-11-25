import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { FileChange } from '../../common/interfaces/commit.interface';

@Injectable()
export class GitLabApiService {
  private readonly logger = new Logger(GitLabApiService.name);
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

  /**
   * 获取 commit 的完整信息，包括 diff
   */
  async getCommitDiff(
    projectId: string,
    sha: string,
  ): Promise<{ diff: string; files: FileChange[] }> {
    try {
      // GitLab API: GET /projects/:id/repository/commits/:sha/diff
      const encodedProjectId = encodeURIComponent(projectId);
      const response = await this.axiosInstance.get(
        `/projects/${encodedProjectId}/repository/commits/${sha}/diff`,
      );

      const diffs = response.data;

      // 构建完整的 diff
      const diffParts: string[] = [];
      const files: FileChange[] = [];

      if (diffs && diffs.length > 0) {
        for (const fileDiff of diffs) {
          const fileChange: FileChange = {
            filename: fileDiff.new_path || fileDiff.old_path,
            status: this.mapFileStatus(fileDiff),
            additions: this.countAdditions(fileDiff.diff),
            deletions: this.countDeletions(fileDiff.diff),
            patch: fileDiff.diff || undefined,
          };
          files.push(fileChange);

          // 构建 diff 文本
          if (fileDiff.diff) {
            diffParts.push(`文件: ${fileChange.filename} (${fileChange.status})`);
            diffParts.push(fileDiff.diff);
            diffParts.push(''); // 空行分隔
          } else {
            diffParts.push(`文件: ${fileChange.filename} (${fileChange.status})`);
            if (fileChange.status === 'renamed') {
              diffParts.push(`重命名: ${fileDiff.old_path} -> ${fileDiff.new_path}`);
            }
            diffParts.push('');
          }
        }
      }

      const diff = diffParts.join('\n').trim();

      return { diff, files };
    } catch (error: any) {
      this.logger.error(`Failed to get commit diff for ${sha}:`, error.message);
      throw error;
    }
  }

  /**
   * 映射 GitLab 文件状态到我们的状态类型
   */
  private mapFileStatus(
    fileDiff: any,
  ): 'added' | 'modified' | 'removed' | 'renamed' {
    if (fileDiff.new_file) {
      return 'added';
    }
    if (fileDiff.deleted_file) {
      return 'removed';
    }
    if (fileDiff.renamed_file || (fileDiff.old_path && fileDiff.new_path && fileDiff.old_path !== fileDiff.new_path)) {
      return 'renamed';
    }
    return 'modified';
  }

  /**
   * 从 diff 字符串中计算新增行数
   */
  private countAdditions(diff: string): number {
    if (!diff) return 0;
    const matches = diff.match(/^\+/gm);
    return matches ? matches.length : 0;
  }

  /**
   * 从 diff 字符串中计算删除行数
   */
  private countDeletions(diff: string): number {
    if (!diff) return 0;
    const matches = diff.match(/^-/gm);
    return matches ? matches.length : 0;
  }
}
