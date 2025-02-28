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

export class ArxivAPI {
  private static readonly BASE_URL = 'http://export.arxiv.org/api/query';
  private static readonly DELAY = Number(process.env.NEXT_PUBLIC_ARXIV_API_DELAY) || Number(process.env.ARXIV_API_DELAY) || 3000;
  private static readonly MAX_RESULTS = Number(process.env.NEXT_PUBLIC_ARXIV_API_MAX_RESULTS) || Number(process.env.ARXIV_API_MAX_RESULTS) || 100;

  static async searchPapers(params: ArxivSearchParams, start = 0, maxResults = this.MAX_RESULTS): Promise<ArxivPaper[]> {
    try {
      const { keyword, categories, startDate, endDate } = params;
      
      // 构建查询条件
      const queryParts = [];

      // 关键词搜索
      if (keyword) {
        queryParts.push(`all:${keyword}`);
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

      console.log(`[ArXiv] 开始获取论文，查询参数：${JSON.stringify({
        query,
        start,
        maxResults,
        sortBy: 'submittedDate',//lastUpdatedDate
        sortOrder: 'descending'
      })}`);

      const response = await axios.get(this.BASE_URL, {
        params: {
          search_query: query,
          start,
          max_results: maxResults,
          sortBy: 'lastUpdatedDate',
          sortOrder: 'descending'
        }
      });

      console.log(`[ArXiv] API响应状态码：${response.status}`);
      const result = await parseXMLString(response.data);
      const papers = this.parseArxivResponse(result);
      console.log(`[ArXiv] 成功获取到 ${papers.length} 篇论文`);
      return papers;
    } catch (error) {
      console.error('Error fetching papers from ArXiv:', error);
      throw new Error('Failed to fetch papers from ArXiv');
    }
  }

  private static parseArxivResponse(data: any): ArxivPaper[] {
    if (!data.feed || !data.feed.entry) {
      console.log('[ArXiv] 未找到任何论文数据');
      return [];
    }

    return data.feed.entry.map((entry: any) => ({
      id: entry.id[0],
      title: entry.title[0],
      summary: entry.summary[0],
      authors: entry.author.map((author: any) => author.name[0]),
      categories: entry.category.map((cat: any) => cat.$.term),
      published: entry.published[0],
      updated: entry.updated[0],
      link: entry.link.find((link: any) => link.$.type === 'text/html')?.$.href || ''
    }));
  }

  static async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.DELAY));
  }
}