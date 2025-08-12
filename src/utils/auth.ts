

export function checkAndRemoveExpiredToken() {
  const token = localStorage.getItem('access_token');
  const expireAt = localStorage.getItem('token_expire_at');
  if (token && expireAt) {
    const now = Date.now();
    if (now > Number(expireAt)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expire_at');
      // ...remove other auth-related keys if needed...
    }
  }
}

/**
 * Safely logout while preserving remembered_username
 * This function should be used instead of directly clearing localStorage
 */
export function safeLogout() {
  console.log('🔐 safeLogout() called');
  console.log('📍 Call stack:', new Error().stack); // ✅ Thêm call stack để biết gọi từ đâu

  // ✅ Đánh dấu đang trong quá trình logout để ThemeContext tránh thay đổi theme
  localStorage.setItem('is_logging_out', 'true');
  console.log('🚪 Set logout flag to prevent theme reset');

  // Lưu lại remembered_username trước khi xóa localStorage
  const rememberedUsername = localStorage.getItem('remembered_username');
  console.log('📝 Current remembered_username:', rememberedUsername);

  // Xóa tất cả auth-related data TRỪ user_config để tránh thay đổi theme
  // user_config sẽ được xóa sau khi redirect hoàn tất
  console.log('🗑️ Clearing auth-related localStorage items...');
  localStorage.removeItem('access_token');
  localStorage.removeItem('customerId');
  localStorage.removeItem('account');
  // localStorage.removeItem('user_config'); // ❌ KHÔNG xóa user_config ở đây
  localStorage.removeItem('admin-event-tab');
  localStorage.removeItem('token_expire_at');

  // Xóa refresh token cookie
  console.log('🍪 Clearing refresh_token cookie...');
  document.cookie = 'refresh_token=; Max-Age=0; path=/;';
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';

  // Khôi phục lại remembered_username nếu có
  if (rememberedUsername) {
    console.log('✅ Restoring remembered_username:', rememberedUsername);
    localStorage.setItem('remembered_username', rememberedUsername);
  } else {
    console.log('⚠️ No remembered_username to restore');
  }

  // Dispatch event để các component khác cập nhật trạng thái
  console.log('📡 Dispatching authChanged event');
  window.dispatchEvent(new Event('authChanged'));

  console.log('🔐 safeLogout() completed');
}

