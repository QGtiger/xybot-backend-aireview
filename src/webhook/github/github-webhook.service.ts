import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { CommitInfo, FileChange, RepositoryInfo } from '../../common/interfaces/commit.interface';

@Injectable()
export class GitHubWebhookService {
  /**
   * 验证 GitHub Webhook 签名
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    if (!signature) {
      return false;
    }

    const hmac = createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return signature === digest;
  }

  /**
   * 解析 GitHub push 事件
   */
  parsePushEvent(payload: any): {
    repository: RepositoryInfo;
    commits: CommitInfo[];
    ref: string;
    before: string;
    after: string;
  } {
    const repository: RepositoryInfo = {
      name: payload.repository.name,
      fullName: payload.repository.full_name,
      owner: payload.repository.owner.login,
      url: payload.repository.html_url,
      platform: 'github',
    };

    const commits: CommitInfo[] = (payload.commits || []).map((commit: any) => ({
      sha: commit.id,
      message: commit.message,
      author: {
        name: commit.author.name,
        email: commit.author.email,
      },
      url: commit.url,
      diff: '', // 需要单独获取
      files: [], // 需要单独获取
    }));

    return {
      repository,
      commits,
      ref: payload.ref,
      before: payload.before,
      after: payload.after,
    };
  }

  /**
   * 解析文件变更信息
   */
  parseFileChanges(files: any[]): FileChange[] {
    return files.map((file) => ({
      filename: file.filename,
      status: file.status as 'added' | 'modified' | 'removed' | 'renamed',
      additions: file.additions || 0,
      deletions: file.deletions || 0,
      patch: file.patch || undefined,
    }));
  }
}

