import instance from '@/services/axios.customize';
import type { Category } from '@/types/Admin/category';

// Category name to ID mapping
const categoryNameToIdMap = new Map<string, string>();
let isInitialized = false;

// Initialize category mapping
export const initializeCategoryMapping = async () => {
    // Skip if already initialized
    if (isInitialized) {
        return;
    }

    try {
        const response = await instance.get('/api/Category/getCategoriesByPaginate?page=1&pageSize=100');
        const categories = response.data.data.items;

        // Clear existing mapping
        categoryNameToIdMap.clear();

        // Build mapping from category name to ID
        categories.forEach((category: Category) => {
            categoryNameToIdMap.set(category.categoryName.toLowerCase(), category.categoryId);
        });

        isInitialized = true;
        console.log('📋 Category mapping initialized:', Object.fromEntries(categoryNameToIdMap));
    } catch (error) {
        console.error('Failed to initialize category mapping:', error);
        throw error;
    }
};

// Convert category names to IDs
export const getCategoryIdsFromNames = (categoryNames: string[]): string[] => {
    const categoryIds: string[] = [];

    categoryNames.forEach(name => {
        const categoryId = categoryNameToIdMap.get(name.toLowerCase());
        if (categoryId) {
            categoryIds.push(categoryId);
        }
    });

    return categoryIds;
};

// Get all available category names
export const getAvailableCategoryNames = (): string[] => {
    return Array.from(categoryNameToIdMap.keys());
};

// Get category ID by name
export const getCategoryIdByName = (categoryName: string): string | undefined => {
    return categoryNameToIdMap.get(categoryName.toLowerCase());
}; 