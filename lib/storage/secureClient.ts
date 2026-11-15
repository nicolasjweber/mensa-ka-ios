import * as SecureStore from 'expo-secure-store';

const CLIENT_ID_KEY = 'mensa_ka_client_id';
const CUSTOM_AUTH_HEADER_KEY = 'mensa_ka_custom_auth_header';

function generateUuidV4(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else if (i === 14) {
      out += '4';
    } else if (i === 19) {
      out += hex[(Math.floor(Math.random() * 16) & 0x3) | 0x8];
    } else {
      out += hex[Math.floor(Math.random() * 16)];
    }
  }
  return out;
}

export async function getOrCreateClientId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(CLIENT_ID_KEY);
    if (existing) {
      return existing;
    }
    const generated = generateUuidV4();
    await SecureStore.setItemAsync(CLIENT_ID_KEY, generated);
    return generated;
  } catch {
    return generateUuidV4();
  }
}

export async function getCustomAuthHeader(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(CUSTOM_AUTH_HEADER_KEY);
  } catch {
    return null;
  }
}

export async function setCustomAuthHeader(value: string | null): Promise<void> {
  try {
    if (!value) {
      await SecureStore.deleteItemAsync(CUSTOM_AUTH_HEADER_KEY);
    } else {
      await SecureStore.setItemAsync(CUSTOM_AUTH_HEADER_KEY, value);
    }
  } catch {
    // Ignore secure store errors in unsupported contexts
  }
}
