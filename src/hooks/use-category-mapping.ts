import { useState } from 'react';
import { initializeCategoryMapping, getCategoryIdsFromNames, getCategoryIdByName } from '@/services/Admin/category.service';

export const useCategoryMapping = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initializeMapping = async () => {
        if (isInitialized) return;

        try {
            setIsLoading(true);
            setError(null);
            await initializeCategoryMapping();
            setIsInitialized(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initialize category mapping');
        } finally {
            setIsLoading(false);
        }
    };

    const convertCategoryNamesToIds = async (categoryNames: string[]): Promise<string[]> => {
        if (!isInitialized) {
            await initializeMapping();
        }
        return getCategoryIdsFromNames(categoryNames);
    };

    const getCategoryId = async (categoryName: string): Promise<string | undefined> => {
        if (!isInitialized) {
            await initializeMapping();
        }
        return getCategoryIdByName(categoryName);
    };

    return {
        isInitialized,
        isLoading,
        error,
        convertCategoryNamesToIds,
        getCategoryId,
        initializeMapping,
    };
}; 