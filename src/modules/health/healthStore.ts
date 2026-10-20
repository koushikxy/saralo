import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage, omitKeys } from '../../core/storage/persistStorage';
import { localDate } from '../../core/date';

export interface ExerciseSet {
  id: string;
  exercise: string;
  weightKg: number;
  reps: number;
  isPR?: boolean;
}

export interface Meal {
  id: string;
  name: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  time: string;
}

export interface Activity {
  id: string;
  name: string;
  minutes: number;
  date: string;
}

export interface HealthState {
  activities: Activity[];
  addActivity: (a: Omit<Activity, 'id'>) => void;
  deleteActivity: (id: string) => void;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  meals: Meal[];
  
  waterMl: number;
  targetWaterMl: number;
  sleepHours: number;
  targetSleepHours: number;
  steps: number;
  targetSteps: number;

  loggedSets: ExerciseSet[];
  day: string;
  stepSensor: boolean;
  
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  removeMeal: (id: string) => void;
  logWater: (amountMl: number) => void;
  setSleep: (hours: number) => void;
  setSteps: (steps: number) => void;
  addSteps: (steps: number) => void;
  rolloverDay: () => void;
  setTargets: (targets: Partial<Pick<HealthState, 'targetCalories' | 'targetWaterMl' | 'targetSleepHours' | 'targetSteps'>>) => void;
  addExerciseSet: (set: Omit<ExerciseSet, 'id'>) => void;
}

export const useHealthStore = create<HealthState>()(
  persist((set, get) => ({
  targetCalories: 2000,
  targetProtein: 60,
  targetCarbs: 250,
  targetFats: 65,

  meals: [],

  waterMl: 0,
  targetWaterMl: 2500,
  sleepHours: 0,
  targetSleepHours: 8.0,
  steps: 0,
  targetSteps: 10000,

  loggedSets: [],
  activities: [],
  addActivity: (a) => set((state) => ({ activities: [{ ...a, id: 'act-' + Date.now() }, ...state.activities] })),
  deleteActivity: (id) => set((state) => ({ activities: state.activities.filter((x) => x.id !== id) })),
  day: localDate(),
  stepSensor: false,

  addMeal: (newMeal) => {
    const meal: Meal = { ...newMeal, id: Date.now().toString() };
    set((state) => ({ meals: [...state.meals, meal] }));
  },

  removeMeal: (id) => {
    set((state) => ({ meals: state.meals.filter((m) => m.id !== id) }));
  },

  logWater: (amountMl) => {
    set((state) => ({ waterMl: Math.max(0, state.waterMl + amountMl) }));
  },

  setSleep: (hours) => {
    set({ sleepHours: hours });
  },

  setSteps: (steps) => {
    set({ steps });
  },

  addSteps: (delta) => {
    set((state) => ({ steps: state.steps + delta }));
  },

  setTargets: (targets) => set(targets),

  rolloverDay: () => {
    if (get().day === localDate()) return;
    set({ day: localDate(), meals: [], waterMl: 0, sleepHours: 0, steps: 0 });
  },

  addExerciseSet: (newSet) => {
    const s: ExerciseSet = { ...newSet, id: Date.now().toString() };
    set((state) => ({ loggedSets: [s, ...state.loggedSets] }));
  },
}), { name: 'lifeos-health', storage: persistStorage, partialize: omitKeys<HealthState>('stepSensor') })
);
