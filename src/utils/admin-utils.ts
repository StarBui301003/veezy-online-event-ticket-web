/**
 * Utility functions for admin-related operations
 */

export interface Account {
  id: string;
  username: string;
  fullName: string;
  role: number; // 0 = Admin, 1 = EventManager, 2 = Customer
  email?: string;
  phone?: string;
}

/**
 * Check if current user is admin (role = 0)
 */
export function isCurrentUserAdmin(): boolean {
  try {
    const accountStr = localStorage.getItem('account');
    if (!accountStr) return false;
    
    const account: Account = JSON.parse(accountStr);
    return account && account.role === 0;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get current user account information
 */
export function getCurrentAccount(): Account | null {
  try {
    const accountStr = localStorage.getItem('account');
    if (!accountStr) return null;
    
    return JSON.parse(accountStr);
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
}

/**
 * Check if current user has specific role
 */
export function hasRole(role: number): boolean {
  const account = getCurrentAccount();
  return account ? account.role === role : false;
}

/**
 * Admin role constants
 */
export const USER_ROLES = {
  ADMIN: 0,
  EVENT_MANAGER: 1,
  CUSTOMER: 2
} as const;

/**
 * Get role name from role number
 */
export function getRoleName(role: number): string {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'Admin';
    case USER_ROLES.EVENT_MANAGER:
      return 'Event Manager';
    case USER_ROLES.CUSTOMER:
      return 'Customer';
    default:
      return 'Unknown';
  }
}
