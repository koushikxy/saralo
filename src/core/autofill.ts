import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useProfileStore, PasswordCategory } from '../modules/profile/profileStore';
import { guessAppType } from './india';

type Native = {
  isSupported: () => boolean;
  isEnabled: () => boolean;
  openSettings: () => void;
  setCredentials: (json: string) => void;
  takePending: () => string;
};

const native = Platform.OS === 'android' ? requireOptionalNativeModule<Native>('SaraloAutofill') : null;

export const autofillSupported = !!native && native.isSupported();
export const autofillEnabled = () => (autofillSupported ? native!.isEnabled() : false);
export const openAutofillSettings = () => native?.openSettings();

const sync = () => {
  if (!autofillSupported) return;
  const list = useProfileStore.getState().passwords.map(({ id, title, username, password, website }) => ({ id, title, username, password, website: website ?? '' }));
  native!.setCredentials(JSON.stringify(list));
};

export const importSavedLogins = () => {
  if (!autofillSupported) return;
  const found: { title: string; username: string; password: string; website: string }[] = JSON.parse(native!.takePending() || '[]');
  const store = useProfileStore.getState();
  found.forEach((x) => {
    const same = store.passwords.find((p) => p.title.toLowerCase() === x.title.toLowerCase() && p.username === x.username);
    if (same) store.updatePassword(same.id, { password: x.password });
    else store.addPassword({ title: x.title, username: x.username, password: x.password, website: x.website || undefined, category: (guessAppType(x.title) ?? 'Other') as PasswordCategory });
  });
  sync();
};

export const watchAutofill = () => {
  if (!autofillSupported) return () => {};
  importSavedLogins();
  return useProfileStore.subscribe((s, prev) => {
    if (s.passwords !== prev.passwords) sync();
  });
};
