// 收藏功能的核心逻辑
export interface FavoriteCategory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface FavoritePaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  categories: string[];
  published: string;
  updated: string;
  link: string;
  // 收藏相关信息
  favoriteId: string; // 唯一收藏ID
  categoryId: string; // 收藏分类ID
  favoritedAt: string; // 收藏时间
  notes?: string; // 用户备注
  // 分析结果（如果有的话）
  analysis?: {
    isRelevant: boolean;
    reason: string;
    score: number;
    titleTrans: string;
    summaryTrans: string;
  };
}

// 预定义的收藏分类
export const DEFAULT_CATEGORIES: FavoriteCategory[] = [
  {
    id: 'default',
    name: '默认收藏',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    description: '默认收藏分类'
  }
];

export class FavoritesService {
  private static readonly STORAGE_KEY = 'paper_favorites';
  private static readonly CATEGORIES_KEY = 'favorite_categories';

  // 获取所有收藏的论文
  static getFavorites(): FavoritePaper[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }

  // 获取收藏分类
  static getCategories(): FavoriteCategory[] {
    try {
      const stored = localStorage.getItem(this.CATEGORIES_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
    } catch (error) {
      console.error('Error loading categories:', error);
      return DEFAULT_CATEGORIES;
    }
  }

  // 保存收藏分类
  static saveCategories(categories: FavoriteCategory[]): void {
    try {
      localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  }

  // 添加收藏
  static addFavorite(paper: { id: string; title: string; authors: string[]; summary: string; published: string; updated?: string; link: string; categories?: string[] }, categoryId: string, notes?: string): FavoritePaper {
    const favorites = this.getFavorites();
    const favoriteId = `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const favoritePaper: FavoritePaper = {
      ...paper,
      updated: paper.updated || paper.published, // 如果没有 updated 字段，使用 published 作为默认值
      categories: paper.categories || [], // 确保 categories 是数组
      favoriteId,
      categoryId,
      favoritedAt: new Date().toISOString(),
      notes
    };

    favorites.push(favoritePaper);
    this.saveFavorites(favorites);
    return favoritePaper;
  }

  // 移除收藏
  static removeFavorite(paperId: string): void {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(fav => fav.id !== paperId);
    this.saveFavorites(filtered);
  }

  // 更新收藏（分类、备注等）
  static updateFavorite(paperId: string, updates: Partial<Pick<FavoritePaper, 'categoryId' | 'notes'>>): void {
    const favorites = this.getFavorites();
    const index = favorites.findIndex(fav => fav.id === paperId);
    
    if (index !== -1) {
      favorites[index] = { ...favorites[index], ...updates };
      this.saveFavorites(favorites);
    }
  }

  // 检查论文是否已收藏
  static isFavorited(paperId: string): boolean {
    const favorites = this.getFavorites();
    return favorites.some(fav => fav.id === paperId);
  }

  // 获取论文的收藏信息
  static getFavoriteInfo(paperId: string): FavoritePaper | null {
    const favorites = this.getFavorites();
    return favorites.find(fav => fav.id === paperId) || null;
  }

  // 按分类获取收藏
  static getFavoritesByCategory(categoryId: string): FavoritePaper[] {
    const favorites = this.getFavorites();
    return favorites.filter(fav => fav.categoryId === categoryId);
  }

  // 搜索收藏的论文
  static searchFavorites(query: string): FavoritePaper[] {
    const favorites = this.getFavorites();
    const lowerQuery = query.toLowerCase();
    
    return favorites.filter(fav => 
      fav.title.toLowerCase().includes(lowerQuery) ||
      fav.summary.toLowerCase().includes(lowerQuery) ||
      fav.authors.some(author => author.toLowerCase().includes(lowerQuery)) ||
      fav.notes?.toLowerCase().includes(lowerQuery)
    );
  }

  // 获取收藏统计
  static getFavoritesStats(): { total: number; byCategory: Record<string, number> } {
    const favorites = this.getFavorites();
    const byCategory: Record<string, number> = {};
    
    favorites.forEach(fav => {
      byCategory[fav.categoryId] = (byCategory[fav.categoryId] || 0) + 1;
    });

    return {
      total: favorites.length,
      byCategory
    };
  }

  // 导出收藏数据
  static exportFavorites(): string {
    const favorites = this.getFavorites();
    const categories = this.getCategories();
    
    return JSON.stringify({
      favorites,
      categories,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  // 导入收藏数据
  static importFavorites(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.favorites && Array.isArray(parsed.favorites)) {
        this.saveFavorites(parsed.favorites);
      }
      
      if (parsed.categories && Array.isArray(parsed.categories)) {
        this.saveCategories(parsed.categories);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing favorites:', error);
      return false;
    }
  }

  // 私有方法：保存收藏数据
  private static saveFavorites(favorites: FavoritePaper[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }
}