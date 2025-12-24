import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// 1. 静态初始化配置（优化方案第 4 点）
const ARXIV_CONFIG = {
  BASE_URL: 'https://export.arxiv.org/api/query',
  DELAY: Number(process.env.NEXT_PUBLIC_ARXIV_API_DELAY) || Number(process.env.ARXIV_API_DELAY) || 3000,
  MAX_RESULTS: Number(process.env.NEXT_PUBLIC_ARXIV_API_MAX_RESULTS) || Number(process.env.ARXIV_API_MAX_RESULTS) || 100,
  PROXY_URL: (process.env.NEXT_PUBLIC_ARXIV_PROXY_URL || process.env.ARXIV_PROXY_URL || '').trim()
};

// 2. 服务器启动日志（脱敏处理）
if (typeof window === 'undefined') {
  console.log('=== [Server Startup] ArXiv Configuration ===');
  console.log(`- API Delay: ${ARXIV_CONFIG.DELAY}ms`);
  console.log(`- Max Results: ${ARXIV_CONFIG.MAX_RESULTS}`);
  console.log(`- Proxy URL: ${ARXIV_CONFIG.PROXY_URL ? (ARXIV_CONFIG.PROXY_URL.substring(0, 15) + '...') : 'None'}`);
  console.log('============================================');
}

// 3. 高性能解析器实例（优化方案第 3 点）
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

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
  static async searchPapers(params: ArxivSearchParams, start = 0, maxResults = ARXIV_CONFIG.MAX_RESULTS): Promise<ArxivPaper[]> {
    try {
      const { keyword, categories, startDate, endDate } = params;
      const queryParts = [];

      if (keyword) {
        keyword.split(' ').forEach((k) => queryParts.push(`all:${k}`));
      }

      if (categories && categories.length > 0) {
        const categoryQuery = categories.map(cat => `cat:${cat}`).join(' OR ');
        queryParts.push(`(${categoryQuery})`);
      }

      if (startDate || endDate) {
        const formatDate = (date: string | undefined) => date ? date.replace(/-/g, '') + '0000' : '*';
        queryParts.push(`submittedDate:[${formatDate(startDate)} TO ${formatDate(endDate)}]`);
      }

      const query = queryParts.join(' AND ') || '*:*';

      // 健壮的 URL 拼接
      let finalUrl = ARXIV_CONFIG.BASE_URL;
      if (ARXIV_CONFIG.PROXY_URL) {
        const normalizedProxy = ARXIV_CONFIG.PROXY_URL.endsWith('/') ? ARXIV_CONFIG.PROXY_URL : `${ARXIV_CONFIG.PROXY_URL}/`;
        finalUrl = `${normalizedProxy}${ARXIV_CONFIG.BASE_URL}`;
      }

      console.log(`[ArXiv] Fetching from: ${finalUrl}`);

      const response = await axios.get(finalUrl, {
        params: {
          search_query: query,
          start,
          max_results: maxResults,
          sortBy: 'lastUpdatedDate',
          sortOrder: 'descending',
          timestamp: Date.now(),
        }
      });

      // 使用 fast-xml-parser 进行高性能解析
      const jsonObj = parser.parse(response.data);
      return this.parseArxivResponse(jsonObj);
    } catch (error) {
      console.error('Error fetching papers from ArXiv:', error);
      throw new Error('Failed to fetch papers from ArXiv');
    }
  }

  private static parseArxivResponse(data: any): ArxivPaper[] {
    const entries = data?.feed?.entry;
    if (!entries) {
      console.log('[ArXiv] No papers found');
      return [];
    }

    // fast-xml-parser 处理单条目和多条目的差异（将其统一为数组）
    const entryList = Array.isArray(entries) ? entries : [entries];

    return entryList.map((entry: any) => {
      // 提取作者
      let authors: string[] = [];
      if (entry.author) {
        const authorArr = Array.isArray(entry.author) ? entry.author : [entry.author];
        authors = authorArr.map((a: any) => a.name);
      }

      // 提取分类
      let categories: string[] = [];
      if (entry.category) {
        const catArr = Array.isArray(entry.category) ? entry.category : [entry.category];
        categories = catArr.map((c: any) => c['@_term']);
      }

      // 提取链接
      let link = '';
      if (entry.link) {
        const linkArr = Array.isArray(entry.link) ? entry.link : [entry.link];
        const htmlLink = linkArr.find((l: any) => l['@_type'] === 'text/html');
        link = htmlLink ? htmlLink['@_href'] : (entry.id || '').replace('abs', 'pdf');
      }

      return {
        id: (entry.id || '').split('/abs/')[1] || entry.id,
        title: (entry.title || '').replace(/\n/g, ' ').trim(),
        summary: (entry.summary || '').replace(/\n/g, ' ').trim(),
        authors,
        categories,
        published: entry.published,
        updated: entry.updated,
        link
      };
    });
  }

  static async delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ARXIV_CONFIG.DELAY));
  }
}
