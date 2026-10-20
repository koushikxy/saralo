export const storageBackend = localStorage;

export const readKey = async (name: string) => localStorage.getItem(name);

export const writeKey = async (name: string, value: string) => localStorage.setItem(name, value);
