import api from '@/services/axios.customize';

export interface OnlineUserAccount {
  accountId: string;
  username: string;
  fullName: string;
  email: string;
  isOnline: boolean;
  lastActiveAt: string;
  role: string;
  avatarUrl?: string;
}

class IdentityService {
  private baseURL = 'http://localhost:5001/api';

  /**
   * Lấy danh sách tất cả users online từ IdentityService
   */
  async getOnlineUsers(): Promise<OnlineUserAccount[]> {
    try {
      console.log('[IdentityService] Fetching online users from IdentityService...');
      const response = await api.get(`${this.baseURL}/Account/online-users`);
      
      console.log('[IdentityService] Online users response:', response.data);
      
      // API returns { flag, code, data } structure, so we need response.data.data
      const responseData = response.data?.data || response.data || [];
      const users = Array.isArray(responseData) ? responseData : [];
      
      console.log('[IdentityService] Parsed users array:', users);
      console.log('[IdentityService] Users count:', users.length);
      
      return users.map((user: any) => ({
        accountId: user.accountId || user.AccountId || user.id,
        username: user.username || user.Username || user.userName,
        fullName: user.fullName || user.FullName || user.username,
        email: user.email || user.Email,
        isOnline: user.isOnline || user.IsOnline || false,
        lastActiveAt: user.lastActiveAt || user.LastActiveAt || new Date().toISOString(),
        role: user.role || user.Role || 'User',
        avatarUrl: user.avatarUrl || user.AvatarUrl || user.avatar
      }));
    } catch (error: any) {
      console.error('[IdentityService] Error fetching online users:', error);
      if (error.response) {
        console.error('[IdentityService] Error response:', error.response.data);
      }
      return [];
    }
  }

  /**
   * Lấy thông tin user theo accountId từ IdentityService
   */
  async getUserById(accountId: string): Promise<OnlineUserAccount | null> {
    try {
      console.log(`[IdentityService] Fetching user ${accountId} from IdentityService...`);
      const response = await api.get(`${this.baseURL}/Account/user/${accountId}`);
      
      console.log('[IdentityService] User response:', response.data);
      
      // API returns { flag, code, data } structure, so we need response.data.data  
      const user = response.data?.data || response.data;
      if (!user) return null;

      return {
        accountId: user.accountId || user.AccountId || user.id,
        username: user.username || user.Username || user.userName,
        fullName: user.fullName || user.FullName || user.username,
        email: user.email || user.Email,
        isOnline: user.isOnline || user.IsOnline || false,
        lastActiveAt: user.lastActiveAt || user.LastActiveAt || new Date().toISOString(),
        role: user.role || user.Role || 'User',
        avatarUrl: user.avatarUrl || user.AvatarUrl || user.avatar
      };
    } catch (error: any) {
      console.error(`[IdentityService] Error fetching user ${accountId}:`, error);
      return null;
    }
  }

  /**
   * Lấy trạng thái online của user theo accountId
   */
  async getUserOnlineStatus(accountId: string): Promise<boolean> {
    try {
      console.log(`[IdentityService] Checking online status for ${accountId}...`);
      const response = await api.get(`${this.baseURL}/Account/user/${accountId}/online-status`);
      
      console.log('[IdentityService] Online status response:', response.data);
      
      // API returns { flag, code, data } structure
      const responseData = response.data?.data || response.data;
      return responseData?.isOnline || false;
    } catch (error: any) {
      console.error(`[IdentityService] Error checking online status for ${accountId}:`, error);
      return false;
    }
  }
}

const identityService = new IdentityService();
export default identityService;
