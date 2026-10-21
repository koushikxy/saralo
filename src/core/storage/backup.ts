import { Platform } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { encryptWithPassword, decryptWithPassword } from '../security/passwordCrypto';
import { useHealthStore } from '../../modules/health/healthStore';
import { useWalletStore } from '../../modules/wallet/walletStore';
import { useFinanceOpsStore } from '../../modules/finance/financeStore';
import { useProfileStore } from '../../modules/profile/profileStore';
import { useVaultSession } from '../security/session';
import { localDate } from '../date';
import { useStyleStore } from '../../modules/style/styleStore';
import { useLifeStore } from '../../modules/life/lifeStore';
import { useFitnessStore } from '../../modules/fitness/fitnessStore';

const stores: Record<string, any> = {
  health: useHealthStore,
  wallet: useWalletStore,
  planner: useFinanceOpsStore,
  profile: useProfileStore,
  style: useStyleStore,
  life: useLifeStore,
  fitness: useFitnessStore,
};

const snapshot = () =>
  Object.fromEntries(
    Object.entries(stores).map(([name, store]) => {
      const state = store.getState();
      const partialize = store.persist.getOptions().partialize;
      return [name, JSON.parse(JSON.stringify(partialize ? partialize(state) : state))];
    })
  );

export const exportBackup = async (password: string) => {
  const content = encryptWithPassword({ app: 'life-os', version: 1, data: snapshot() }, password);
  const fileName = `saralo-backup-${new Date().toISOString().slice(0, 10)}.saralo`;

  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type: 'application/octet-stream' }));
    link.download = fileName;
    link.click();
    return;
  }

  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(content);
  useVaultSession.getState().setPicking(true);
  try {
    await Sharing.shareAsync(file.uri, { dialogTitle: 'Save your Saralo backup', mimeType: 'application/octet-stream' });
    useProfileStore.getState().setLastBackup(localDate());
  } finally {
    setTimeout(() => useVaultSession.getState().setPicking(false), 1500);
  }
};

export const pickBackupFile = async () => {
  useVaultSession.getState().setPicking(true);
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true }).finally(() => setTimeout(() => useVaultSession.getState().setPicking(false), 1500));
  if (result.canceled) return null;
  const asset = result.assets[0];
  return asset.file ? asset.file.text() : new File(asset.uri).text();
};

export const restoreBackup = (content: string, password: string) => {
  const backup = decryptWithPassword<{ app: string; data: Record<string, object> }>(content, password);
  if (backup?.app !== 'life-os') throw new Error('Not a Saralo backup');
  Object.entries(backup.data).forEach(([name, state]) => stores[name]?.setState(state));
};

export const wipeAllData = async () => {
  for (const store of Object.values(stores)) {
    store.setState(store.getInitialState(), true);
    await store.persist.clearStorage();
  }
  if (Platform.OS === 'web') return;
  for (const name of ['vault', 'photos']) {
    try {
      const dir = new Directory(Paths.document, name);
      if (dir.exists) dir.delete();
    } catch {}
  }
};
