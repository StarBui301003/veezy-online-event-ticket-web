import axios from '@/services/axios.customize';

class UserActivityService {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 240000; // 4 phút (thấp hơn 5 phút threshold của backend)
  private isActive = true;
  private lastActivity = Date.now();

  // Khởi tạo tracking user activity
  public initializeActivityTracking(): void {
    this.setupActivityListeners();
    this.startHeartbeat();
  }

  // Dừng tracking
  public stopActivityTracking(): void {
    this.stopHeartbeat();
    this.removeActivityListeners();
  }

  // Setup event listeners cho user activity
  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, this.updateActivity, true);
    });

    // Listen cho visibility change (tab switch, minimize window)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Listen cho window focus/blur
    window.addEventListener('focus', this.handleWindowFocus);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  // Remove event listeners
  private removeActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.removeEventListener(event, this.updateActivity, true);
    });

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('blur', this.handleWindowBlur);
  }

  // Update activity timestamp
  private updateActivity = (): void => {
    this.lastActivity = Date.now();
    this.isActive = true;
  };

  // Handle visibility change (tab switch)
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.isActive = true;
      this.updateActivity();
      this.sendHeartbeat(); // Send immediate heartbeat when tab becomes visible
    } else {
      this.isActive = false;
    }
  };

  // Handle window focus
  private handleWindowFocus = (): void => {
    this.isActive = true;
    this.updateActivity();
    this.sendHeartbeat();
  };

  // Handle window blur
  private handleWindowBlur = (): void => {
    this.isActive = false;
  };

  // Start heartbeat interval
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear existing interval nếu có

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);

    // Send initial heartbeat
    this.sendHeartbeat();
  }

  // Stop heartbeat interval
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Send heartbeat to backend - Backend tự động update qua OnlineStatusMiddleware
  private async sendHeartbeat(): Promise<void> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Chỉ send heartbeat nếu user đang active hoặc activity trong vòng 5 phút gần đây
      const timeSinceLastActivity = Date.now() - this.lastActivity;
      const isRecentlyActive = timeSinceLastActivity < 300000; // 5 phút

      if (this.isActive || isRecentlyActive) {
        // Backend sử dụng OnlineStatusMiddleware để tự động update khi có authenticated request
        // Chỉ cần gọi một API bất kỳ để trigger middleware
        await axios.get('/api/Account/profile', {
          headers: { 'Content-Type': 'application/json' }
        });

        // Emit custom event để notify UI components
        window.dispatchEvent(new CustomEvent('userActivityUpdated', {
          detail: { timestamp: Date.now(), isActive: this.isActive }
        }));
      }
    } catch (error) {
      // Ignore errors để không spam console với lỗi API
    }
  }

  // Manual update activity (để call từ components khác)
  public updateUserActivity(): void {
    this.updateActivity();
    this.sendHeartbeat();
  }

  // Get current activity status
  public getActivityStatus(): { isActive: boolean; lastActivity: number } {
    return {
      isActive: this.isActive,
      lastActivity: this.lastActivity
    };
  }

  // Force send heartbeat (for manual triggers)
  public forceHeartbeat(): Promise<void> {
    return this.sendHeartbeat();
  }
}

// Export singleton instance
export const userActivityService = new UserActivityService();
export default userActivityService;
