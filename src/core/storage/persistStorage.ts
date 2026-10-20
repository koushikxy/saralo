import { createJSONStorage, StateStorage } from 'zustand/middleware';
import { AESEncryptionKey, AESSealedData, aesEncryptAsync, aesDecryptAsync } from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { storageBackend, readKey, writeKey } from './storageBackend';

const KEY_NAME = 'lifeos_vault_key';
const SEALED_PREFIX = 'sealed:';

const loadKey = async () => {
  const saved = await readKey(KEY_NAME);
  if (saved) return AESEncryptionKey.import(saved, 'base64');
  const key = await AESEncryptionKey.generate();
  await writeKey(KEY_NAME, await key.encoded('base64'));
  return key;
};

let keyPromise: Promise<AESEncryptionKey> | null = null;
const getKey = () =>
  (keyPromise ??= loadKey().catch((e) => {
    keyPromise = null;
    throw e;
  }));

const seal = async (text: string) => {
  const input = CryptoJS.enc.Utf8.parse(text).toString(CryptoJS.enc.Base64);
  const sealed = await aesEncryptAsync(input, await getKey());
  return SEALED_PREFIX + (await sealed.combined('base64'));
};

const open = async (value: string) => {
  if (!value.startsWith(SEALED_PREFIX)) return value;
  const bytes = Uint8Array.from(atob(value.slice(SEALED_PREFIX.length)), (c) => c.charCodeAt(0));
  const sealed = AESSealedData.fromCombined(bytes);
  const output = await aesDecryptAsync(sealed, await getKey(), { output: 'base64' });
  return CryptoJS.enc.Base64.parse(output).toString(CryptoJS.enc.Utf8);
};

export const failedReads = new Set<string>();

const retry = async <T,>(task: () => Promise<T>, tries = 4): Promise<T> => {
  try {
    return await task();
  } catch (e) {
    if (tries <= 1) throw e;
    await new Promise((r) => setTimeout(r, 250));
    return retry(task, tries - 1);
  }
};

const encryptedBackend = (): StateStorage => {
  const backend: StateStorage = storageBackend;
  return {
    getItem: async (name) => {
      let raw: string | null;
      try {
        raw = await retry(() => Promise.resolve(backend.getItem(name)));
        failedReads.delete(name);
      } catch (e) {
        failedReads.add(name);
        console.warn(`[Saralo] Could not read ${name}:`, e instanceof Error ? e.message : e);
        throw e;
      }
      if (raw == null) return null;
      try {
        return await retry(() => open(raw!), 2);
      } catch (e) {
        await backend.setItem(`${name}.unreadable`, raw);
        console.warn(`[Saralo] ${name} could not be unlocked and was set aside:`, e instanceof Error ? e.message : e);
        return null;
      }
    },
    setItem: async (name, value) => {
      if (failedReads.has(name)) return;
      await retry(async () => backend.setItem(name, await seal(value)));
    },
    removeItem: (name) => backend.removeItem(name),
  };
};

export const persistStorage = createJSONStorage(encryptedBackend);

export const omitKeys =
  <T extends object>(...keys: (keyof T)[]) =>
  (state: T) => {
    const copy = { ...state };
    keys.forEach((k) => delete copy[k]);
    return copy;
  };
