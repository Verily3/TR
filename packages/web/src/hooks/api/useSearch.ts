import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SearchResultItem {
  id: string;
  type: 'program' | 'person' | 'goal' | 'assessment';
  title: string;
  subtitle?: string;
  url: string;
}

export interface SearchResults {
  programs: SearchResultItem[];
  people: SearchResultItem[];
  goals: SearchResultItem[];
  assessments: SearchResultItem[];
}

export function useSearch(tenantId: string | null | undefined, query: string) {
  return useQuery({
    queryKey: ['search', tenantId, query],
    queryFn: async () => {
      const response = (await api.get<SearchResults>(
        `/api/tenants/${tenantId}/search?q=${encodeURIComponent(query)}`
      )) as unknown as { data: SearchResults };
      return response.data;
    },
    enabled: !!tenantId && query.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: { programs: [], people: [], goals: [], assessments: [] },
  });
}
