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
const getKey = () => (keyPromise ??= loadKey());

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

const encryptedBackend = (): StateStorage => {
  const backend: StateStorage = storageBackend;
  return {
    getItem: async (name) => {
      const value = await backend.getItem(name);
      return value == null ? null : open(value);
    },
    setItem: async (name, value) => backend.setItem(name, await seal(value)),
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
