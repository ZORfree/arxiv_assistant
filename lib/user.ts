
export class UserService {
  private static readonly USER_ID_KEY = 'user_id';

  static getUserId(): string {
    if (typeof window === 'undefined') {
      // 服务器端渲染时返回临时ID
      return 'temp-server-id';
    }
    
    let userId = localStorage.getItem(this.USER_ID_KEY);
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem(this.USER_ID_KEY, userId);
    }
    return userId;
  }

  static resetUserId(): string {
    if (typeof window === 'undefined') {
      return 'temp-server-id'; // 服务器端不执行
    }
    
    const newUserId = crypto.randomUUID();
    localStorage.setItem(this.USER_ID_KEY, newUserId);
    return newUserId;
  }
}