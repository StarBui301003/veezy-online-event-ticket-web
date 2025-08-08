import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  initializeCategoryMapping,
  getCategoryIdsFromNames,
  getCategoryIdByName,
} from '@/services/Admin/category.service';

interface CategoryMappingContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initializeMapping: () => Promise<void>;
  convertCategoryNamesToIds: (categoryNames: string[]) => string[];
  getCategoryId: (categoryName: string) => string | undefined;
}

const CategoryMappingContext = createContext<CategoryMappingContextType | undefined>(undefined);

export const CategoryMappingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeMapping = useCallback(async () => {
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
  }, [isInitialized]);

  const convertCategoryNamesToIds = useCallback(
    (categoryNames: string[]): string[] => {
      if (!isInitialized) {
        return [];
      }
      return getCategoryIdsFromNames(categoryNames);
    },
    [isInitialized]
  );

  const getCategoryId = useCallback(
    (categoryName: string): string | undefined => {
      if (!isInitialized) {
        return undefined;
      }
      return getCategoryIdByName(categoryName);
    },
    [isInitialized]
  );

  const value: CategoryMappingContextType = {
    isInitialized,
    isLoading,
    error,
    initializeMapping,
    convertCategoryNamesToIds,
    getCategoryId,
  };

  return (
    <CategoryMappingContext.Provider value={value}>{children}</CategoryMappingContext.Provider>
  );
};

export const useCategoryMapping = (): CategoryMappingContextType => {
  const context = useContext(CategoryMappingContext);
  if (context === undefined) {
    throw new Error('useCategoryMapping must be used within a CategoryMappingProvider');
  }
  return context;
};
