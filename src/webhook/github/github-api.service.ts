import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import {  FileChange } from '../../common/interfaces/commit.interface';

@Injectable()
export class GitHubApiService {
  private readonly logger = new Logger(GitHubApiService.name);
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

  /**
   * 获取 commit 的完整信息，包括 diff
   */
  async getCommitDiff(
    owner: string,
    repo: string,
    sha: string,
  ): Promise<{ diff: string; files: FileChange[] }> {
    try {
      const response = await this.octokit.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });

      const commit = response.data;

      // 构建完整的 diff
      const diffParts: string[] = [];
      const files: FileChange[] = [];

      if (commit.files && commit.files.length > 0) {
        for (const file of commit.files) {
          const fileChange: FileChange = {
            filename: file.filename,
            status: this.mapFileStatus(file.status),
            additions: file.additions || 0,
            deletions: file.deletions || 0,
            patch: file.patch || undefined,
          };
          files.push(fileChange);

          // 构建 diff 文本
          if (file.patch) {
            diffParts.push(`文件: ${file.filename} (${file.status})`);
            diffParts.push(file.patch);
            diffParts.push(''); // 空行分隔
          } else {
            diffParts.push(`文件: ${file.filename} (${file.status})`);
            if (file.status === 'renamed') {
              diffParts.push(`重命名: ${file.previous_filename} -> ${file.filename}`);
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
   * 映射 GitHub 文件状态到我们的状态类型
   */
  private mapFileStatus(
    status: string,
  ): 'added' | 'modified' | 'removed' | 'renamed' {
    switch (status) {
      case 'added':
        return 'added';
      case 'removed':
        return 'removed';
      case 'renamed':
        return 'renamed';
      case 'modified':
      case 'changed':
      default:
        return 'modified';
    }
  }
}

