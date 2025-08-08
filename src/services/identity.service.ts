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
  userId?: string; // Additional field for compatibility
}

class IdentityService {
  private baseURL = '/api';

  /**
   * Lấy danh sách tất cả users (online + offline) với thông tin online status
   */
  async getAllUsersWithStatus(): Promise<OnlineUserAccount[]> {
    try {
      // Try to get all users first (using the correct endpoint)
      try {
        const allUsersResponse = await api.get(`${this.baseURL}/Account/customers?page=1&pageSize=1000`);
        const allUsersData = allUsersResponse.data?.data?.items || allUsersResponse.data?.items || [];
        
        if (Array.isArray(allUsersData) && allUsersData.length > 0) {
          // Get online users to merge status
          const onlineUsers = await this.getOnlineUsers();
          const onlineUserIds = new Set(onlineUsers.map(u => u.accountId));
          
          // Merge all users with online status
          const usersWithStatus = allUsersData.map((user: any) => {
            const accountId = user.accountId || user.AccountId || user.id;
            const isOnline = onlineUserIds.has(accountId);
            const onlineUserData = onlineUsers.find(ou => ou.accountId === accountId);
            
            return {
              accountId,
              username: user.username || user.Username || user.userName || user.email,
              fullName: user.fullName || user.FullName || user.username || 'Unknown User',
              email: user.email || user.Email,
              isOnline,
              lastActiveAt: onlineUserData?.lastActiveAt || user.lastActiveAt || user.LastActiveAt || new Date().toISOString(),
              role: user.role || user.Role || 'User',
              avatarUrl: user.avatarUrl || user.AvatarUrl || user.avatar,
              userId: user.userId || user.UserId || accountId // For compatibility
            };
          });
          
          return usersWithStatus;
        }
      } catch (error) {
        // Failed to get all users from /customers endpoint, falling back to online users only
      }
      
      // Fallback: just return online users if we can't get all users
      return await this.getOnlineUsers();
      
    } catch (error: any) {
      // Error fetching all users with status
      return [];
    }
  }

  /**
   * Lấy danh sách tất cả users online từ IdentityService
   */
  async getOnlineUsers(): Promise<OnlineUserAccount[]> {
    try {
      const response = await api.get(`${this.baseURL}/Account/online-users`);
      
      // API returns { flag, code, data } structure, so we need response.data.data
      const responseData = response.data?.data || response.data || [];
      const users = Array.isArray(responseData) ? responseData : [];
      
      return users.map((user: any) => ({
        accountId: user.accountId || user.AccountId || user.id,
        username: user.username || user.Username || user.userName,
        fullName: user.fullName || user.FullName || user.username,
        email: user.email || user.Email,
        isOnline: user.isOnline || user.IsOnline || false,
        lastActiveAt: user.lastActiveAt || user.LastActiveAt || new Date().toISOString(),
        role: user.role || user.Role || 'User',
        avatarUrl: user.avatarUrl || user.AvatarUrl || user.avatar,
        userId: user.userId || user.UserId || user.accountId || user.AccountId || user.id
      }));
    } catch (error: any) {
      // Error fetching online users
      return [];
    }
  }

  /**
   * Lấy thông tin user theo accountId từ danh sách tất cả users
   * (Alternative to individual API call that doesn't exist)
   */
  async getUserById(accountId: string): Promise<OnlineUserAccount | null> {
    try {
      const allUsers = await this.getAllUsersWithStatus();
      
      // Find user by accountId or userId (primary identifiers)
      let user = allUsers.find(u => u.accountId === accountId || u.userId === accountId);
      
      if (!user) {
        // Try to find by other potential ID fields for compatibility
        user = allUsers.find(u => 
          u.username === accountId ||
          u.email === accountId
        );
      }
      
      return user || null;
    } catch (error: any) {
      // Error looking up user
      return null;
    }
  }

  /**
   * Lấy trạng thái online của user theo accountId
   */
  async getUserOnlineStatus(accountId: string): Promise<boolean> {
    try {
      const response = await api.get(`${this.baseURL}/Account/user/${accountId}/online-status`);
      
      // API returns { flag, code, data } structure
      const responseData = response.data?.data || response.data;
      return responseData?.isOnline || false;
    } catch (error: any) {
      // Error checking online status
      return false;
    }
  }
}

const identityService = new IdentityService();
export default identityService;
