/**
 * Utility functions for managing account updates and triggering theme updates
 */

interface Account {
    userId?: string;
    accountId?: string;
    [key: string]: unknown;
}

interface UserConfig {
    userId?: string;
    theme?: number;
    language?: number;
    [key: string]: unknown;
}

// Type for UserConfig from service (without userId)
interface ServiceUserConfig {
    language: number;
    theme: number;
    receiveEmail: boolean;
    receiveNotify: boolean;
}

/**
 * Set account in localStorage and trigger theme update
 * This ensures that when account changes, theme is updated accordingly
 */
export const setAccountAndUpdateTheme = (account: Account) => {
    localStorage.setItem('account', JSON.stringify(account));

    // Trigger theme update by dispatching custom event
    window.dispatchEvent(new CustomEvent('accountUpdated', {
        detail: { account }
    }));
};

/**
 * Remove account from localStorage and trigger theme update
 */
export const removeAccountAndUpdateTheme = () => {
    localStorage.removeItem('account');

    // Trigger theme update by dispatching custom event
    window.dispatchEvent(new CustomEvent('accountUpdated', {
        detail: { account: null }
    }));
};

/**
 * Update user config in localStorage and trigger theme update
 * This ensures that when user config changes (including theme), it's updated accordingly
 */
export const updateUserConfigAndTriggerUpdate = (config: UserConfig) => {
    localStorage.setItem('user_config', JSON.stringify(config));

    // Trigger theme update by dispatching custom event
    window.dispatchEvent(new CustomEvent('userConfigUpdated', {
        detail: { config }
    }));
};

/**
 * Update service user config in localStorage and trigger theme update
 * This handles UserConfig from service (without userId) by adding current userId
 */
export const updateServiceUserConfigAndTriggerUpdate = (config: ServiceUserConfig) => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
        const configWithUserId = {
            ...config,
            userId: currentUserId,
        };
        localStorage.setItem('user_config', JSON.stringify(configWithUserId));

        // Trigger theme update by dispatching custom event
        window.dispatchEvent(new CustomEvent('userConfigUpdated', {
            detail: { config: configWithUserId }
        }));
    }
};

/**
 * Get current account from localStorage
 */
export const getCurrentAccount = (): Account | null => {
    try {
        const accStr = localStorage.getItem('account');
        return accStr ? JSON.parse(accStr) : null;
    } catch {
        return null;
    }
};

/**
 * Get current user ID from localStorage
 */
export const getCurrentUserId = (): string | null => {
    const account = getCurrentAccount();
    return account?.userId || account?.accountId || null;
};
