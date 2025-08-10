/**
 * 🧪 Online Status System Test Utilities
 * Comprehensive test script for validating online status synchronization
 */

// Test utility functions for validating online status system
class OnlineStatusTester {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
  }

  /**
   * Run comprehensive online status tests
   */
  async runAllTests() {
    if (this.isRunning) {
      console.log('🔄 Tests already running...');
      return;
    }

    this.isRunning = true;
    this.testResults = [];
    
    console.log('🚀 Starting Online Status System Tests...');
    console.log('═'.repeat(60));

    try {
      // Test 1: Check SignalR connection
      await this.testSignalRConnection();
      
      // Test 2: Test API endpoints
      await this.testAPIEndpoints();
      
      // Test 3: Test OnlineStatusContext
      await this.testOnlineStatusContext();
      
      // Test 4: Test real-time events (manual)
      this.testRealtimeEvents();
      
      // Test 5: Performance tests
      await this.testPerformance();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.isRunning = false;
      this.printTestResults();
    }
  }

  /**
   * Test SignalR connection status
   */
  async testSignalRConnection() {
    console.log('\n🔗 Testing SignalR Connection...');
    
    try {
      // Check if signalR service is available
      const signalRService = window.signalRService || (await import('../services/signalr.service'));
      
      if (!signalRService) {
        this.addResult('SignalR Service', false, 'SignalR service not available');
        return;
      }
      
      // Check notification hub connection
      const connections = signalRService.connections || {};
      const notificationHub = connections.notification;
      
      if (notificationHub) {
        const state = notificationHub.state;
        const isConnected = state === 'Connected';
        
        this.addResult('NotificationHub Connection', isConnected, 
          `Connection state: ${state}`);
        
        if (isConnected) {
          console.log('✅ NotificationHub connected successfully');
        } else {
          console.log(`⚠️ NotificationHub state: ${state}`);
        }
      } else {
        this.addResult('NotificationHub Connection', false, 'NotificationHub not initialized');
      }
      
    } catch (error) {
      this.addResult('SignalR Connection', false, error.message);
    }
  }

  /**
   * Test API endpoints
   */
  async testAPIEndpoints() {
    console.log('\n🌐 Testing API Endpoints...');
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.addResult('API Authentication', false, 'No access token found');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test 1: Online users endpoint
    try {
      console.log('📡 Testing /online-users endpoint...');
      const response = await fetch('/api/v1/Account/online-users', { headers });
      
      if (response.ok) {
        const data = await response.json();
        const isValid = data.flag && Array.isArray(data.data);
        
        this.addResult('Online Users API', isValid, 
          `Status: ${response.status}, Users: ${data.data?.length || 0}`);
          
        if (isValid) {
          console.log(`✅ Found ${data.data.length} online users`);
          console.log('Sample user data:', data.data[0]);
        }
      } else {
        this.addResult('Online Users API', false, `HTTP ${response.status}`);
      }
    } catch (error) {
      this.addResult('Online Users API', false, error.message);
    }

    // Test 2: Current user's online status
    try {
      const userClaims = this.parseJwtToken(token);
      const accountId = userClaims?.sub;
      
      if (accountId) {
        console.log('📡 Testing user online status endpoint...');
        const response = await fetch(`/api/v1/Account/user/${accountId}/online-status`, { headers });
        
        if (response.ok) {
          const data = await response.json();
          const isValid = data.flag && data.data;
          
          this.addResult('User Status API', isValid, 
            `Status: ${response.status}, Online: ${data.data?.isOnline}`);
            
          if (isValid) {
            console.log(`✅ Current user online status: ${data.data.isOnline}`);
          }
        } else {
          this.addResult('User Status API', false, `HTTP ${response.status}`);
        }
      } else {
        this.addResult('User Status API', false, 'Could not extract accountId from token');
      }
    } catch (error) {
      this.addResult('User Status API', false, error.message);
    }
  }

  /**
   * Test OnlineStatusContext functionality
   */
  async testOnlineStatusContext() {
    console.log('\n⚛️ Testing OnlineStatusContext...');
    
    try {
      // Check if React context is available
      if (typeof window.React === 'undefined') {
        this.addResult('OnlineStatusContext', false, 'React not available in window');
        return;
      }

      // Try to get context from window (if exposed for testing)
      const onlineStatusContext = window.onlineStatusContext;
      
      if (onlineStatusContext) {
        const { onlineUsers, totalOnlineUsers, isUserOnline, loading, error } = onlineStatusContext;
        
        // Test context data
        const hasUsers = Array.isArray(onlineUsers) && onlineUsers.length > 0;
        const totalValid = typeof totalOnlineUsers === 'number' && totalOnlineUsers >= 0;
        const hasMethod = typeof isUserOnline === 'function';
        
        this.addResult('OnlineStatusContext Data', hasUsers && totalValid && hasMethod,
          `Users: ${onlineUsers?.length}, Total: ${totalOnlineUsers}, Loading: ${loading}, Error: ${error}`);
          
        if (hasUsers) {
          console.log(`✅ Context loaded with ${onlineUsers.length} users`);
          console.log('Sample user:', onlineUsers[0]);
          
          // Test isUserOnline function
          const testUserId = onlineUsers[0]?.userId;
          if (testUserId) {
            const isOnline = isUserOnline(testUserId);
            console.log(`✅ isUserOnline(${testUserId}): ${isOnline}`);
          }
        }
      } else {
        this.addResult('OnlineStatusContext', false, 'Context not exposed to window for testing');
        console.log('💡 To test context, expose it to window in development mode');
      }
      
    } catch (error) {
      this.addResult('OnlineStatusContext', false, error.message);
    }
  }

  /**
   * Test real-time events (manual observation)
   */
  testRealtimeEvents() {
    console.log('\n⚡ Setting up Real-time Event Monitoring...');
    
    try {
      // Setup event listeners for manual testing
      const originalConsoleLog = console.log;
      let eventCount = 0;
      
      // Monitor SignalR debug logs
      const monitorSignalREvents = () => {
        // Look for SignalR debug messages
        const signalRRegex = /\[SignalR DEBUG\].*UserOnline|UserOffline/;
        
        // Override console.log temporarily to catch SignalR events
        console.log = function(...args) {
          const message = args.join(' ');
          if (signalRRegex.test(message)) {
            eventCount++;
            originalConsoleLog(`🎯 CAPTURED EVENT #${eventCount}:`, ...args);
          }
          originalConsoleLog(...args);
        };
      };

      monitorSignalREvents();
      
      this.addResult('Real-time Event Monitor', true, 'Event monitoring active');
      
      console.log('✅ Real-time event monitoring is now active');
      console.log('💡 Manual Test Instructions:');
      console.log('   1. Open another browser/incognito window');
      console.log('   2. Login with different user');
      console.log('   3. Watch for UserOnline events in console');
      console.log('   4. Logout from other window');
      console.log('   5. Watch for UserOffline events in console');
      console.log('   6. Call stopEventMonitoring() to stop');
      
      // Expose stop function globally
      window.stopEventMonitoring = () => {
        console.log = originalConsoleLog;
        console.log(`🛑 Event monitoring stopped. Captured ${eventCount} events.`);
      };
      
    } catch (error) {
      this.addResult('Real-time Event Monitor', false, error.message);
    }
  }

  /**
   * Test performance metrics
   */
  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    try {
      // Test API response time
      const startTime = performance.now();
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await fetch('/api/v1/Account/online-users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        const isGoodPerformance = responseTime < 1000; // Under 1 second
        
        this.addResult('API Response Time', isGoodPerformance,
          `${responseTime.toFixed(2)}ms (Target: <1000ms)`);
          
        if (isGoodPerformance) {
          console.log(`✅ API response time: ${responseTime.toFixed(2)}ms`);
        } else {
          console.log(`⚠️ Slow API response: ${responseTime.toFixed(2)}ms`);
        }
      }
      
    } catch (error) {
      this.addResult('Performance Test', false, error.message);
    }
  }

  /**
   * Add test result
   */
  addResult(testName, passed, details) {
    this.testResults.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Print test results summary
   */
  printTestResults() {
    console.log('\n📊 Test Results Summary');
    console.log('═'.repeat(60));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`Overall: ${passed}/${total} tests passed (${passRate}%)`);
    console.log('');
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.details}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    
    if (passed === total) {
      console.log('🎉 ALL TESTS PASSED! Online Status System is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the details above for issues.');
    }
  }

  /**
   * Parse JWT token to extract claims
   */
  parseJwtToken(token) {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }
}

// Expose tester globally for easy access
window.OnlineStatusTester = OnlineStatusTester;

// Auto-run basic tests in development
if ((typeof import !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) ||
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development')) {
  console.log('🧪 Online Status Tester loaded. Run tests with:');
  console.log('   const tester = new OnlineStatusTester();');
  console.log('   tester.runAllTests();');
}

export default OnlineStatusTester;
