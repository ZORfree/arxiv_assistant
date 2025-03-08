
export class UserService {
  private static readonly USER_ID_KEY = 'user_id';

  static getUserId(): string {
    let userId = localStorage.getItem(this.USER_ID_KEY);
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem(this.USER_ID_KEY, userId);
    }
    return userId;
  }

  static resetUserId(): string {
    const newUserId = crypto.randomUUID();
    localStorage.setItem(this.USER_ID_KEY, newUserId);
    return newUserId;
  }
}