import Storage from 'expo-sqlite/kv-store';
import * as SecureStore from 'expo-secure-store';

export const storageBackend = Storage;

export const readKey = (name: string) => SecureStore.getItemAsync(name);

export const writeKey = (name: string, value: string) => SecureStore.setItemAsync(name, value);
