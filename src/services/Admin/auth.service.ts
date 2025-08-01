import instance from "../axios.customize";

// Change password API
export const changePasswordAPI = async (currentPassword: string, newPassword: string) => {
    try {
        const response = await instance.post('/api/Account/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    } catch (error: any) {
        console.error('[ChangePassword] API Error:', {
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
            message: error?.message
        });
        throw error;
    }
};

// Get current user profile
export const getCurrentUserAPI = async () => {
    try {
        const response = await instance.get('/api/Account/profile');
        return response.data.data;
    } catch (error: any) {
        console.error('[GetCurrentUser] API Error:', {
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
            message: error?.message
        });
        throw error;
    }
}; 