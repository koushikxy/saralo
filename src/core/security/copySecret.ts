import * as Clipboard from 'expo-clipboard';

let timer: ReturnType<typeof setTimeout> | null = null;

export const copySecret = async (text: string) => {
  await Clipboard.setStringAsync(text);
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    if ((await Clipboard.getStringAsync().catch(() => '')) === text) Clipboard.setStringAsync('').catch(() => {});
  }, 30000);
};
