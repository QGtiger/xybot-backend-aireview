export interface CommitInfo {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  url: string;
  diff: string;
  files: FileChange[];
}

export interface FileChange {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
}

export interface RepositoryInfo {
  name: string;
  fullName: string;
  owner: string;
  url: string;
  platform: 'github' | 'gitlab';
}

