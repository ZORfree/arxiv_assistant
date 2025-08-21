import axios from 'axios';

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

export interface VersionInfo {
  latestUpdate: string;
  commits: GitHubCommit[];
}

export class GitHubAPI {
  private static readonly REPO_API_URL = 'https://api.github.com/repos/ZORfree/arxiv_assistant/commits';

  static async getVersionInfo(): Promise<VersionInfo> {
    try {
      const response = await axios.get(this.REPO_API_URL);
      const commits = response.data as GitHubCommit[];
      
      if (!commits || commits.length === 0) {
        throw new Error('No commit information found');
      }
      
      // 获取最新的提交日期
      const latestUpdate = commits[0].commit.author.date;
      
      return {
        latestUpdate,
        commits: commits.slice(0, 10) // 只返回最近的10条提交记录
      };
    } catch (error) {
      console.error('Error fetching version info from GitHub:', error);
      throw new Error('Failed to fetch version information');
    }
  }
}