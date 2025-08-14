// Debug utility for tracking notification API calls
class NotificationDebugger {
    private static instance: NotificationDebugger;
    private apiCallLog: Map<string, Array<{ timestamp: number; stack: string; component: string }>> = new Map();
    private duplicateCallCount: Map<string, number> = new Map();

    private constructor() { }

    static getInstance(): NotificationDebugger {
        if (!NotificationDebugger.instance) {
            NotificationDebugger.instance = new NotificationDebugger();
        }
        return NotificationDebugger.instance;
    }

    logApiCall(notificationId: string, component: string) {
        const timestamp = Date.now();
        const stack = new Error().stack || '';

        if (!this.apiCallLog.has(notificationId)) {
            this.apiCallLog.set(notificationId, []);
        }

        const calls = this.apiCallLog.get(notificationId)!;
        calls.push({ timestamp, stack, component });

        // Check for duplicates within a short time window (100ms)
        const recentCalls = calls.filter(call => timestamp - call.timestamp < 100);
        if (recentCalls.length > 1) {
            const count = this.duplicateCallCount.get(notificationId) || 0;
            this.duplicateCallCount.set(notificationId, count + 1);

            console.warn(`🚨 DUPLICATE API CALL DETECTED for notification ${notificationId}:`, {
                notificationId,
                duplicateCount: recentCalls.length,
                totalDuplicates: count + 1,
                calls: recentCalls.map(call => ({
                    component: call.component,
                    timestamp: new Date(call.timestamp).toISOString(),
                    timeDiff: timestamp - call.timestamp
                }))
            });
        }

        console.log(`📝 API call logged for notification ${notificationId} from ${component} at ${new Date(timestamp).toISOString()}`);
    }

    getDuplicateStats() {
        const stats = Array.from(this.duplicateCallCount.entries())
            .filter(([, count]) => count > 0)
            .map(([notificationId, count]) => ({ notificationId, duplicateCount: count }));

        if (stats.length > 0) {
            console.table(stats);
        } else {
            console.log('✅ No duplicate API calls detected');
        }

        return stats;
    }

    clearLogs() {
        this.apiCallLog.clear();
        this.duplicateCallCount.clear();
        console.log('🧹 Notification debug logs cleared');
    }

    getApiCallHistory(notificationId?: string) {
        if (notificationId) {
            const calls = this.apiCallLog.get(notificationId);
            if (calls) {
                console.log(`📊 API call history for notification ${notificationId}:`, calls);
                return calls;
            }
            console.log(`❌ No API calls found for notification ${notificationId}`);
            return [];
        }

        // Return all calls
        const allCalls = Array.from(this.apiCallLog.entries()).map(([id, calls]) => ({
            notificationId: id,
            callCount: calls.length,
            lastCall: calls[calls.length - 1]?.timestamp
        }));

        console.table(allCalls);
        return allCalls;
    }
}

// Export singleton instance
export const notificationDebugger = NotificationDebugger.getInstance();

// Helper function to log API calls
export const logNotificationApiCall = (notificationId: string, component: string) => {
    notificationDebugger.logApiCall(notificationId, component);
};

// Make debugger available globally for console access
if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).notificationDebugger = notificationDebugger;
}
