import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../../core/storage/persistStorage';

export interface WorkoutSet {
  kg: number;
  reps: number;
}

export interface WorkoutExercise {
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  title: string;
  date: string;
  minutes: number;
  exercises: WorkoutExercise[];
}

export interface Routine {
  id: string;
  name: string;
  exercises: string[];
}

export const EXERCISES: Record<string, string[]> = {
  Chest: ['Bench press', 'Incline dumbbell press', 'Push-ups', 'Chest fly', 'Dips'],
  Back: ['Deadlift', 'Pull-ups', 'Lat pulldown', 'Seated row', 'Bent-over row'],
  Legs: ['Squat', 'Leg press', 'Lunges', 'Leg curl', 'Leg extension', 'Calf raise'],
  Shoulders: ['Overhead press', 'Lateral raise', 'Front raise', 'Rear delt fly', 'Shrugs'],
  Arms: ['Bicep curl', 'Hammer curl', 'Tricep pushdown', 'Skull crushers'],
  Core: ['Plank', 'Crunches', 'Leg raises', 'Russian twist'],
};

interface FitnessState {
  workouts: Workout[];
  routines: Routine[];
  customExercises: string[];
  saveWorkout: (w: Omit<Workout, 'id'> & { id?: string }) => void;
  deleteWorkout: (id: string) => void;
  saveRoutine: (r: Omit<Routine, 'id'> & { id?: string }) => void;
  deleteRoutine: (id: string) => void;
  addCustomExercise: (name: string) => void;
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const useFitnessStore = create<FitnessState>()(
  persist(
    (set) => ({
      workouts: [],
      routines: [],
      customExercises: [],
      saveWorkout: (w) =>
        set((s) => {
          const item = { ...w, id: w.id ?? newId() };
          const rest = s.workouts.filter((x) => x.id !== item.id);
          return { workouts: [item, ...rest].sort((a, b) => b.date.localeCompare(a.date)) };
        }),
      deleteWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),
      saveRoutine: (r) =>
        set((s) => {
          const item = { ...r, id: r.id ?? newId() };
          return { routines: [...s.routines.filter((x) => x.id !== item.id), item] };
        }),
      deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
      addCustomExercise: (name) =>
        set((s) => (s.customExercises.includes(name) ? s : { customExercises: [...s.customExercises, name] })),
    }),
    { name: 'saralo-fitness', storage: persistStorage }
  )
);

export const lastTime = (workouts: Workout[], name: string, skipId?: string) => {
  for (const w of workouts) {
    if (w.id === skipId) continue;
    const ex = w.exercises.find((e) => e.name === name && e.sets.length > 0);
    if (ex) return ex.sets;
  }
  return null;
};

export const bestLift = (workouts: Workout[], name: string) => {
  let best: WorkoutSet | null = null;
  for (const w of workouts)
    for (const e of w.exercises)
      if (e.name === name)
        for (const s of e.sets) if (!best || s.kg > best.kg || (s.kg === best.kg && s.reps > best.reps)) best = s;
  return best;
};

export const describeSets = (sets: WorkoutSet[]) => {
  if (sets.length === 0) return '';
  const top = sets.reduce((a, b) => (b.kg > a.kg ? b : a));
  const same = sets.every((s) => s.kg === sets[0].kg && s.reps === sets[0].reps);
  if (same) return `${sets.length} × ${sets[0].reps}${sets[0].kg ? ` · ${sets[0].kg} kg` : ''}`;
  return `${sets.length} sets · best ${top.kg ? `${top.kg} kg × ` : ''}${top.reps}`;
};
