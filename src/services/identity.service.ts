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
      console.log('[IdentityService] Fetching all users with status from IdentityService...');
      
      // Try to get all users first (using the correct endpoint)
      try {
        const allUsersResponse = await api.get(`${this.baseURL}/Account/customers?page=1&pageSize=1000`);
        const allUsersData = allUsersResponse.data?.data?.items || allUsersResponse.data?.items || [];
        
        console.log('[IdentityService] Got all users from /customers endpoint:', allUsersData.length);
        
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
          
          console.log('[IdentityService] Merged users with status:', usersWithStatus.length);
          return usersWithStatus;
        }
      } catch (error) {
        console.log('[IdentityService] Failed to get all users from /customers endpoint, falling back to online users only');
      }
      
      // Fallback: just return online users if we can't get all users
      return await this.getOnlineUsers();
      
    } catch (error: any) {
      console.error('[IdentityService] Error fetching all users with status:', error);
      return [];
    }
  }

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
        avatarUrl: user.avatarUrl || user.AvatarUrl || user.avatar,
        userId: user.userId || user.UserId || user.accountId || user.AccountId || user.id
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
   * Lấy thông tin user theo accountId từ danh sách tất cả users
   * (Alternative to individual API call that doesn't exist)
   */
  async getUserById(accountId: string): Promise<OnlineUserAccount | null> {
    try {
      console.log(`[IdentityService] Looking up user ${accountId} in all users list...`);
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
      
      console.log(`[IdentityService] User lookup result:`, user || 'Not found');
      return user || null;
    } catch (error: any) {
      console.error(`[IdentityService] Error looking up user ${accountId}:`, error);
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
