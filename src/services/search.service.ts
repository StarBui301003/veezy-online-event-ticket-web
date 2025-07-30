import instance from "@/services/axios.customize";

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  type: string;
  imageUrl: string;
  date: string;
}

export const searchEvents = async (searchTerm: string): Promise<SearchResult[]> => {
  try {
    const response = await instance.get('/api/Event/global-search', {
      params: { searchTerm }
    });
    
    if (response.data.flag) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
};
