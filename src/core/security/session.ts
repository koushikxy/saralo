import { create } from 'zustand';

type Session = {
  appUnlocked: boolean;
  unlocked: boolean;
  lastUse: number;
  picking: boolean;
  set: (v: boolean) => void;
  unlockApp: () => void;
  lockAll: () => void;
  touch: () => void;
  setPicking: (v: boolean) => void;
};

export const useVaultSession = create<Session>((set) => ({
  appUnlocked: false,
  unlocked: false,
  lastUse: 0,
  picking: false,
  set: (v) => set({ unlocked: v, lastUse: Date.now() }),
  unlockApp: () => set({ appUnlocked: true, unlocked: true, lastUse: Date.now() }),
  lockAll: () => set({ appUnlocked: false, unlocked: false }),
  touch: () => set({ lastUse: Date.now() }),
  setPicking: (v) => set({ picking: v, lastUse: Date.now() }),
}));
