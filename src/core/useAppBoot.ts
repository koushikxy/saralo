import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useHealthStore } from '../modules/health/healthStore';
import { useWalletStore } from '../modules/wallet/walletStore';
import { useFinanceOpsStore } from '../modules/finance/financeStore';
import { useProfileStore } from '../modules/profile/profileStore';
import { useStyleStore } from '../modules/style/styleStore';
import { useLifeStore } from '../modules/life/lifeStore';
import { useFitnessStore } from '../modules/fitness/fitnessStore';
import { watchReminders } from './reminders';
import { watchAutofill, importSavedLogins } from './autofill';
import { failedReads, flushWrites } from './storage/persistStorage';
import { useVaultSession } from './security/session';

const stores = [
  useHealthStore,
  useWalletStore,
  useFinanceOpsStore,
  useProfileStore,
  useStyleStore,
  useLifeStore,
  useFitnessStore,
];

const LOCK_AFTER_MS = 15000;

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

  const native = requireOptionalNativeModule<{ readSteps?: () => Promise<number>; startStepTracking: () => void }>('SaraloAutofill');
  if (native?.readSteps) {
    native.startStepTracking();
    const read = () =>
      native.readSteps!()
        .then((steps) => steps >= 0 && useHealthStore.getState().setTodaySteps(steps))
        .catch(() => {});
    read();
    const timer = setInterval(() => AppState.currentState === 'active' && read(), 15000);
    const sub = AppState.addEventListener('change', (state) => state === 'active' && read());
    return {
      remove: () => {
        clearInterval(timer);
        sub.remove();
      },
    };
  }

  let last = 0;
  let counted = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return Pedometer.watchStepCount(({ steps }) => {
    counted = steps;
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      useHealthStore.getState().rolloverDay();
      useHealthStore.getState().addSteps(counted - last);
      last = counted;
    }, 3000);
  });
};


export const useAppBoot = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stepSub: { remove: () => void } | null = null;
    let stopReminders: (() => void) | null = null;
    let stopAutofill: (() => void) | null = null;
    waitForHydration().then(() => {
      runDaily();
      setReady(true);
      retryFailedReads();
      startStepCounter().then((sub) => (stepSub = sub)).catch(() => {});
      stopReminders = watchReminders();
      stopAutofill = watchAutofill();
    });
    let leftAt = 0;
    const appSub = AppState.addEventListener('change', (state) => {
      const session = useVaultSession.getState();
      if (state === 'active') {
        if (leftAt && Date.now() - leftAt > LOCK_AFTER_MS && !session.picking) session.lockAll();
        leftAt = 0;
        retryFailedReads();
        runDaily();
        importSavedLogins();
      }
      if (state !== 'active') flushWrites();
      if (state === 'background') {
        leftAt = Date.now();
        if (!session.picking) session.set(false);
      }
    });
    return () => {
      appSub.remove();
      stepSub?.remove();
      stopReminders?.();
      stopAutofill?.();
    };
  }, []);

  return ready;
};
