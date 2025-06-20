

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

