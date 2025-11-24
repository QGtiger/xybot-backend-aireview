import { Injectable } from '@nestjs/common';
import { CommitInfo, FileChange, RepositoryInfo } from '../../common/interfaces/commit.interface';

@Injectable()
export class GitLabWebhookService {
  /**
   * 解析 GitLab Push Hook 事件
   */
  parsePushEvent(payload: any): {
    repository: RepositoryInfo;
    commits: CommitInfo[];
    ref: string;
    before: string;
    after: string;
  } {
    const repository: RepositoryInfo = {
      name: payload.project.name,
      fullName: payload.project.path_with_namespace,
      owner: payload.project.namespace,
      url: payload.project.web_url,
      platform: 'gitlab',
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
  parseFileChanges(changes: any[]): FileChange[] {
    return changes.map((change) => {
      let status: 'added' | 'modified' | 'removed' | 'renamed';
      if (change.new_file) {
        status = 'added';
      } else if (change.deleted_file) {
        status = 'removed';
      } else if (change.renamed_file) {
        status = 'renamed';
      } else {
        status = 'modified';
      }

      return {
        filename: change.new_path || change.old_path,
        status,
        additions: 0, // GitLab 不直接提供，需要从 diff 计算
        deletions: 0,
        patch: change.diff || undefined,
      };
    });
  }
}

