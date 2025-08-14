// Test utility for notification API deduplication
import { markNotificationRead } from '@/services/notification.service';

export const testNotificationDeduplication = async (notificationId: string, userId: string) => {
    console.log('🧪 Testing notification deduplication...');

    // Simulate multiple rapid calls
    const promises = [
        markNotificationRead(notificationId, userId),
        markNotificationRead(notificationId, userId),
        markNotificationRead(notificationId, userId),
        markNotificationRead(notificationId, userId),
        markNotificationRead(notificationId, userId)
    ];

    try {
        const results = await Promise.all(promises);
        console.log('📊 Test results:', results);

        // Check if all results are the same (deduplication working)
        const uniqueResults = new Set(results.map(r => JSON.stringify(r)));
        if (uniqueResults.size === 1) {
            console.log('✅ SUCCESS: All calls returned the same result (deduplication working)');
        } else {
            console.log('❌ FAILED: Different results returned (deduplication not working)');
        }

        return results;
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
};

// Test Header component deduplication specifically
export const testHeaderComponentDeduplication = async (notificationId: string, userId: string) => {
    console.log('🚨 Testing Header component deduplication...');

    // Simulate Header component calls with rapid succession
    console.log('📞 Simulating Header.NotificationDropdown call 1...');
    const result1 = await markNotificationRead(notificationId, userId);
    console.log('📞 Result 1:', result1);

    // Wait 50ms and try again (should be blocked)
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('📞 Simulating Header.NotificationDropdown call 2 (should be blocked)...');
    const result2 = await markNotificationRead(notificationId, userId);
    console.log('📞 Result 2:', result2);

    // Wait 100ms and try again (should be blocked)
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('📞 Simulating Header.NotificationDropdown call 3 (should be blocked)...');
    const result3 = await markNotificationRead(notificationId, userId);
    console.log('📞 Result 3:', result3);

    // Check if deduplication worked
    if (result1.flag && !result2.flag && !result3.flag) {
        console.log('✅ SUCCESS: Header component deduplication working correctly');
    } else {
        console.log('❌ FAILED: Header component deduplication not working');
    }

    return { result1, result2, result3 };
};

// Test cross-component deduplication
export const testCrossComponentDeduplication = async (notificationId: string, userId: string) => {
    console.log('🔄 Testing cross-component deduplication...');

    // Simulate calls from different components
    console.log('📞 Simulating EventDetail call...');
    const result1 = await markNotificationRead(notificationId, userId);

    // Wait 30ms and try from Header (should be blocked)
    await new Promise(resolve => setTimeout(resolve, 30));
    console.log('📞 Simulating Header call (should be blocked)...');
    const result2 = await markNotificationRead(notificationId, userId);

    // Check if cross-component deduplication worked
    if (result1.flag && !result2.flag) {
        console.log('✅ SUCCESS: Cross-component deduplication working correctly');
    } else {
        console.log('❌ FAILED: Cross-component deduplication not working');
    }

    return { result1, result2 };
};

// Make test functions available globally
if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).testNotificationDeduplication = testNotificationDeduplication;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).testHeaderComponentDeduplication = testHeaderComponentDeduplication;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).testCrossComponentDeduplication = testCrossComponentDeduplication;
}
