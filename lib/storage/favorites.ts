import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FavoriteSnapshot } from '@/types/mensa';

const FAVORITES_KEY = 'mensa-ka:favorites:v1';

export async function loadFavorites(): Promise<Record<string, FavoriteSnapshot>> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<string, FavoriteSnapshot> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (value && typeof value === 'object' && typeof (value as FavoriteSnapshot).name === 'string') {
        result[key] = value as FavoriteSnapshot;
      }
    }
    return result;
  } catch {
    return {};
  }
}

export async function saveFavorites(favorites: Record<string, FavoriteSnapshot>): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // Ignore storage write errors
  }
}
