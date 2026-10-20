import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useHealthStore } from '../modules/health/healthStore';
import { useWalletStore } from '../modules/wallet/walletStore';
import { useFinanceOpsStore } from '../modules/finance/financeStore';
import { useProfileStore } from '../modules/profile/profileStore';
import { useStyleStore } from '../modules/style/styleStore';
import { useLifeStore } from '../modules/life/lifeStore';
import { useFitnessStore } from '../modules/fitness/fitnessStore';
import { watchReminders } from './reminders';
import { failedReads } from './storage/persistStorage';
import { useVaultSession } from '../screens/vault/VaultGate';

const stores = [
  useHealthStore,
  useWalletStore,
  useFinanceOpsStore,
  useProfileStore,
  useStyleStore,
  useLifeStore,
  useFitnessStore,
];

const nameOf = (s: (typeof stores)[number]) => s.persist.getOptions().name ?? '';
const settled = (s: (typeof stores)[number]) => s.persist.hasHydrated() || failedReads.has(nameOf(s));

const waitForHydration = () =>
  new Promise<void>((done) => {
    const started = Date.now();
    const check = () => {
      if (stores.every(settled)) return done();
      if (Date.now() - started > 8000) {
        console.warn('[Saralo] Saved data is slow to load:', stores.filter((s) => !settled(s)).map(nameOf).join(', '));
        return done();
      }
      setTimeout(check, 50);
    };
    check();
  });

const retryFailedReads = () => stores.filter((s) => failedReads.has(nameOf(s))).forEach((s) => s.persist.rehydrate());

const runDaily = () => {
  useHealthStore.getState().rolloverDay();
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startStepCounter = async () => {
  if (Platform.OS === 'web' || !(await Pedometer.isAvailableAsync())) return null;
  if (!(await Pedometer.requestPermissionsAsync()).granted) return null;
  useHealthStore.setState({ stepSensor: true });

  if (Platform.OS === 'ios') {
    const sync = () =>
      Pedometer.getStepCountAsync(startOfToday(), new Date())
        .then(({ steps }) => useHealthStore.getState().setSteps(steps))
        .catch(() => {});
    sync();
    return Pedometer.watchStepCount(sync);
  }

  let last = 0;
  return Pedometer.watchStepCount(({ steps }) => {
    useHealthStore.getState().rolloverDay();
    useHealthStore.getState().addSteps(steps - last);
    last = steps;
  });
};


export const useAppBoot = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stepSub: { remove: () => void } | null = null;
    let stopReminders: (() => void) | null = null;
    waitForHydration().then(() => {
      runDaily();
      setReady(true);
      retryFailedReads();
      startStepCounter().then((sub) => (stepSub = sub)).catch(() => {});
      stopReminders = watchReminders();
    });
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        retryFailedReads();
        runDaily();
      }
      if (state === 'background') useVaultSession.getState().set(false);
    });
    return () => {
      appSub.remove();
      stepSub?.remove();
      stopReminders?.();
    };
  }, []);

  return ready;
};
