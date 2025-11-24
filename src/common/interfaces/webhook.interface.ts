import { CommitInfo, RepositoryInfo } from './commit.interface';

export interface WebhookPayload {
  repository: RepositoryInfo;
  commits: CommitInfo[];
  ref: string;
  before: string;
  after: string;
}

