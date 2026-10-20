import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useHealthStore } from '../modules/health/healthStore';
import { useWalletStore } from '../modules/wallet/walletStore';
import { useFinanceOpsStore } from '../modules/finance/financeStore';
import { useProfileStore } from '../modules/profile/profileStore';
import { useStyleStore } from '../modules/style/styleStore';
import { useLifeStore } from '../modules/life/lifeStore';
import { watchReminders } from './reminders';
import { useVaultSession } from '../screens/vault/VaultGate';

const stores = [
  useHealthStore,
  useWalletStore,
  useFinanceOpsStore,
  useProfileStore,
  useStyleStore,
  useLifeStore,
];

const waitForHydration = () =>
  new Promise<void>((done) => {
    const timer = setTimeout(() => {
      console.warn('[Saralo] Saved data took too long to load:', stores.filter((s) => !s.persist.hasHydrated()).map((s) => s.persist.getOptions().name).join(', '));
      done();
    }, 4000);
    Promise.all(
      stores.map((s) =>
        s.persist.hasHydrated() ? null : new Promise<void>((ok) => s.persist.onFinishHydration(() => ok()))
      )
    ).then(() => {
      clearTimeout(timer);
      done();
    });
  });

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
      startStepCounter().then((sub) => (stepSub = sub)).catch(() => {});
      stopReminders = watchReminders();
    });
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runDaily();
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
