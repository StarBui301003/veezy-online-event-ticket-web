// Environment configuration
export const config = {
  // Gateway URL for API
  gatewayUrl: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000',
  // API base URL
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || `${import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000'}/api`,
  // App name
  appName: import.meta.env.VITE_APP_NAME || 'Veezy Event Ticket',
} as const;

// Helper functions
export const getApiUrl = (endpoint: string) => `${config.apiBaseUrl}${endpoint}`;
export const getGatewayUrl = (endpoint: string) => `${config.gatewayUrl}${endpoint}`; 