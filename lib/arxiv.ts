import axios from 'axios';
// 导入 xml2js 类型定义
import { parseString } from 'xml2js';

import { promisify } from 'util';

const parseXMLString = promisify(parseString);

export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  categories: string[];
  published: string;
  updated: string;
  link: string;
}

export interface ArxivSearchParams {
  keyword?: string;
  categories?: string[];
  startDate?: string;
  endDate?: string;
}

interface ArxivAuthor {
  name: string[];
}

interface ArxivCategory {
  $: {
    term: string;
  };
}

interface ArxivLink {
  $: {
    href: string;
    type: string;
  };
}

interface ArxivEntry {
  id: string[];
  title: string[];
  summary: string[];
  author: ArxivAuthor[];
  category: ArxivCategory[];
  published: string[];
  updated: string[];
  link: ArxivLink[];
}

interface ArxivResponse {
  feed: {
    entry?: ArxivEntry[];
  };
}

export class ArxivAPI {
  private static readonly BASE_URL = 'https://export.arxiv.org/api/query';
  private static readonly DELAY = Number(process.env.NEXT_PUBLIC_ARXIV_API_DELAY) || Number(process.env.ARXIV_API_DELAY) || 3000;
  private static readonly MAX_RESULTS = Number(process.env.NEXT_PUBLIC_ARXIV_API_MAX_RESULTS) || Number(process.env.ARXIV_API_MAX_RESULTS) || 100;

  static async searchPapers(params: ArxivSearchParams, start = 0, maxResults = this.MAX_RESULTS): Promise<ArxivPaper[]> {
    try {
      const { keyword, categories, startDate, endDate } = params;

      // 构建查询条件
      const queryParts = [];

      // 关键词搜索
      if (keyword) {
        //keyword进行空格分割
        const keywords = keyword.split(' ');
        //遍历keywords
        keywords.forEach((k) => {
          queryParts.push(`all:${k}`);
        })
      }

      // 分类查询
      if (categories && categories.length > 0) {
        const categoryQuery = categories.map(cat => `cat:${cat}`).join(' OR ');
        queryParts.push(`(${categoryQuery})`);
      }

      // 日期范围查询
      if (startDate || endDate) {
        const formatDate = (date: string | undefined) => {
          if (!date) return '*';
          return date.replace(/-/g, '') + '0000';
        };
        const dateQuery = `submittedDate:[${formatDate(startDate)} TO ${formatDate(endDate)}]`;
        queryParts.push(dateQuery);
      }

      // 组合所有查询条件
      const query = queryParts.join(' AND ') || '*:*';

      // 从环境变量读取代理URL（客户端可见）
      const envProxyUrl = (process.env.NEXT_PUBLIC_ARXIV_PROXY_URL || process.env.ARXIV_PROXY_URL || '').trim();
      const finalUrl = envProxyUrl ? `${envProxyUrl}${this.BASE_URL}` : this.BASE_URL;

      console.log(`[ArXiv] 开始获取论文，查询参数：${JSON.stringify({
        query,
        start,
        maxResults,
        sortBy: 'submittedDate',//lastUpdatedDate
        sortOrder: 'descending',
        finalUrl
      })}`);

      const response = await axios.get(finalUrl, {
        params: {
          search_query: query,
          start,
          max_results: maxResults,
          sortBy: 'lastUpdatedDate',
          sortOrder: 'descending',
          timestamp: Date.now(), // 添加当前时间戳，避免缓存问题
        }
      });

      console.log(`[ArXiv] API响应状态码：${response.status}`);
      const result = await parseXMLString(response.data) as ArxivResponse;
      const papers = this.parseArxivResponse(result);
      console.log(`[ArXiv] 成功获取到 ${papers.length} 篇论文`);
      return papers;
    } catch (error) {
      console.error('Error fetching papers from ArXiv:', error);
      throw new Error('Failed to fetch papers from ArXiv');
    }
  }

  private static parseArxivResponse(data: ArxivResponse): ArxivPaper[] {
    if (!data.feed || !data.feed.entry) {
      console.log('[ArXiv] 未找到任何论文数据');
      return [];
    }

    return data.feed.entry.map((entry: ArxivEntry) => ({
      id: entry.id[0].slice(21),
      title: entry.title[0],
      summary: entry.summary[0],
      authors: entry.author.map((author: ArxivAuthor) => author.name[0]),
      categories: entry.category.map((cat: ArxivCategory) => cat.$.term),
      published: entry.published[0],
      updated: entry.updated[0],
      link: entry.link.find((link: ArxivLink) => link.$.type === 'text/html')?.$.href || entry.id[0].replace('abs', 'pdf')
    }));
  }

  static async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.DELAY));
  }
}