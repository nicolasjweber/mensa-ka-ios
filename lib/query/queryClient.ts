import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // Matches Cloudflare Edge CACHE_TTL_SECONDS = 900
      gcTime: 7 * 24 * 60 * 60 * 1000,
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'mensa-ka:react-query:v1',
  throttleTime: 1000,
});
