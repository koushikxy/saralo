import React, { useState } from 'react';
import { Form, Field, Pick } from '../../ui/kit';
import { useHealthStore } from '../../modules/health/healthStore';
import { localDate } from '../../core/date';

type Nav = { navigation: any; route: any };

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
const ACTIVITIES = ['Walk', 'Yoga', 'Gym', 'Cycling', 'Running', 'Sports', 'Other'];
const num = (v: string) => Math.max(0, Number(v.replace(/[^0-9.]/g, '')) || 0);

export const MealForm: React.FC<Nav> = ({ navigation }) => {
  const addMeal = useHealthStore((s) => s.addMeal);
  const hour = new Date().getHours();
  const [name, setName] = useState('');
  const [type, setType] = useState<(typeof MEALS)[number]>(hour < 11 ? 'Breakfast' : hour < 16 ? 'Lunch' : hour < 19 ? 'Snack' : 'Dinner');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  const save = () => {
    addMeal({
      name: name.trim(),
      mealType: type,
      calories: num(calories),
      proteinG: num(protein),
      carbsG: 0,
      fatsG: 0,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    });
    navigation.goBack();
  };

  return (
    <Form title="Log a meal" onCancel={() => navigation.goBack()} onSave={save} canSave={!!name.trim()}>
      <Field label="What did you eat?" value={name} onChangeText={setName} autoFocus />
      <Pick label="Meal" options={MEALS} value={type} onChange={(v) => setType(v as (typeof MEALS)[number])} />
      <Field label="Calories (optional)" keyboardType="numeric" value={calories} onChangeText={setCalories} hint="Leave empty if you don't know" />
      <Field label="Protein in grams (optional)" keyboardType="numeric" value={protein} onChangeText={setProtein} />
    </Form>
  );
};

export const ActivityForm: React.FC<Nav> = ({ navigation }) => {
  const addActivity = useHealthStore((s) => s.addActivity);
  const [name, setName] = useState('Walk');
  const [minutes, setMinutes] = useState('30');

  const save = () => {
    addActivity({ name, minutes: Math.round(num(minutes)), date: localDate() });
    navigation.goBack();
  };

  return (
    <Form title="Log activity" onCancel={() => navigation.goBack()} onSave={save} canSave={num(minutes) > 0}>
      <Pick label="What did you do?" options={ACTIVITIES} value={name} onChange={setName} />
      <Field label="For how many minutes?" keyboardType="number-pad" value={minutes} onChangeText={setMinutes} autoFocus />
    </Form>
  );
};

export const GoalsForm: React.FC<Nav> = ({ navigation }) => {
  const { targetSteps, targetWaterMl, targetSleepHours, targetCalories, setTargets } = useHealthStore();
  const [steps, setSteps] = useState(String(targetSteps));
  const [water, setWater] = useState(String(targetWaterMl / 1000));
  const [sleep, setSleep] = useState(String(targetSleepHours));
  const [calories, setCalories] = useState(String(targetCalories));

  const save = () => {
    setTargets({
      targetSteps: Math.round(num(steps)) || targetSteps,
      targetWaterMl: Math.round((num(water) || targetWaterMl / 1000) * 1000),
      targetSleepHours: num(sleep) || targetSleepHours,
      targetCalories: Math.round(num(calories)) || targetCalories,
    });
    navigation.goBack();
  };

  return (
    <Form title="Daily goals" onCancel={() => navigation.goBack()} onSave={save}>
      <Field label="Steps" keyboardType="number-pad" value={steps} onChangeText={setSteps} />
      <Field label="Water in litres" keyboardType="decimal-pad" value={water} onChangeText={setWater} />
      <Field label="Sleep in hours" keyboardType="decimal-pad" value={sleep} onChangeText={setSleep} />
      <Field label="Calories" keyboardType="number-pad" value={calories} onChangeText={setCalories} />
    </Form>
  );
};
