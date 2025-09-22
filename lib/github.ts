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
        return this.getDefaultVersionInfo();
      }
      
      // 获取最新的提交日期
      const latestUpdate = commits[0].commit.author.date;
      
      return {
        latestUpdate,
        commits: commits.slice(0, 10) // 只返回最近的10条提交记录
      };
    } catch (error) {
      console.error('Error fetching version info from GitHub:', error);
      // 返回默认版本信息而不是抛出异常
      return this.getDefaultVersionInfo();
    }
  }

  private static getDefaultVersionInfo(): VersionInfo {
    return {
      latestUpdate: new Date().toISOString(),
      commits: [{
        sha: 'unknown',
        commit: {
          author: {
            name: 'System',
            email: 'system@example.com',
            date: new Date().toISOString()
          },
          message: '版本信息暂时无法获取'
        },
        html_url: '#'
      }]
    };
  }
}