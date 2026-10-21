import React, { useState } from 'react';
import { pickIcon } from '../../ui/pickIcons';
import { useShallow } from 'zustand/react/shallow';
import { View } from 'react-native';
import { Form, Field, Pick, ToggleRow, T, Section, Row, Segmented } from '../../ui/kit';
import { useProfileStore } from '../../modules/profile/profileStore';
import { goalsFor } from '../../core/goals';
import { TouchableOpacity } from '../../components/Touchable';
import { useColors } from '../../core/theme';
import { Minus, Plus, X } from 'lucide-react-native';
import { searchFoods, findFood, Food } from '../../core/food';
import { useHealthStore } from '../../modules/health/healthStore';
import { localDate } from '../../core/date';

type Nav = { navigation: any; route: any };

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
const ACTIVITIES = ['Walk', 'Yoga', 'Gym', 'Cycling', 'Running', 'Sports', 'Other'];
const num = (v: string) => Math.max(0, Number(v.replace(/[^0-9.]/g, '')) || 0);

export const MealForm: React.FC<Nav> = ({ navigation }) => {
  const c = useColors();
  const { addMeal, recentFoods } = useHealthStore(useShallow(({ addMeal, recentFoods }) => ({ addMeal, recentFoods })));
  const hour = new Date().getHours();
  const [query, setQuery] = useState('');
  const [food, setFood] = useState<Food | null>(null);
  const [qty, setQty] = useState(1);
  const [type, setType] = useState<(typeof MEALS)[number]>(hour < 11 ? 'Breakfast' : hour < 16 ? 'Lunch' : hour < 19 ? 'Snack' : 'Dinner');
  const [own, setOwn] = useState(false);
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const results = food || own ? [] : query.trim() ? searchFoods(query) : recentFoods.map(findFood).filter((f): f is Food => !!f).slice(0, 6);

  const save = () => {
    const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (food) {
      addMeal({ name: `${qty === 1 ? '' : `${qty} × `}${food.name}`, mealType: type, calories: Math.round(food.kcal * qty), proteinG: Math.round(food.protein * qty * 10) / 10, carbsG: Math.round(food.carbs * qty * 10) / 10, fatsG: Math.round(food.fat * qty * 10) / 10, time });
      useHealthStore.setState((st) => ({ recentFoods: [food.name, ...st.recentFoods.filter((n) => n !== food.name)].slice(0, 12) }));
    } else {
      addMeal({ name: query.trim(), mealType: type, calories: num(calories), proteinG: num(protein), carbsG: num(carbs), fatsG: num(fat), time });
    }
    navigation.goBack();
  };

  const stat = (label: string, value: number, unit: string) => (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: c.soft }}>
      <T v="h2">
        {Math.round(value * 10) / 10}
        <T v="caption">{unit}</T>
      </T>
      <T v="caption">{label}</T>
    </View>
  );

  return (
    <Form title="Log food" onCancel={() => navigation.goBack()} onSave={save} canSave={!!food || (own && !!query.trim())}>
      <Pick label="Meal" options={MEALS} value={type} onChange={(v) => setType(v as (typeof MEALS)[number])} />
      {food ? (
        <View style={{ marginHorizontal: 16, marginBottom: 18, padding: 16, borderRadius: 22, backgroundColor: c.card }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <T v="h2">{food.name}</T>
              <T v="sub">
                1 {food.serving} · {food.kcal} kcal
              </T>
            </View>
            <TouchableOpacity onPress={() => { setFood(null); setQty(1); }} accessibilityLabel="Choose another food" style={{ padding: 6 }}>
              <X size={22} color={c.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginVertical: 16 }}>
            <TouchableOpacity onPress={() => setQty(Math.max(0.5, qty - 0.5))} accessibilityLabel="Less" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Minus size={22} color={c.ink} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center', minWidth: 90 }}>
              <T v="big">{qty}</T>
              <T v="caption">{food.serving}</T>
            </View>
            <TouchableOpacity onPress={() => setQty(qty + 0.5)} accessibilityLabel="More" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {stat('Calories', food.kcal * qty, '')}
            {stat('Protein', food.protein * qty, ' g')}
            {stat('Carbs', food.carbs * qty, ' g')}
            {stat('Fat', food.fat * qty, ' g')}
          </View>
        </View>
      ) : (
        <>
          <Field label={own ? 'Food name' : 'What did you eat?'} value={query} onChangeText={setQuery} autoFocus maxLength={60} placeholder={own ? undefined : 'Search, like roti, dal or poha'} autoCorrect={false} />
          {results.length ? (
            <Section title={query.trim() ? 'Pick one' : 'Recent'}>
              {results.map((f, i) => (
                <Row key={f.name} title={f.name} subtitle={`1 ${f.serving} · ${f.protein} g protein`} rightText={`${f.kcal} kcal`} onPress={() => setFood(f)} last={i === results.length - 1} />
              ))}
            </Section>
          ) : null}
          {!own ? (
            <TouchableOpacity onPress={() => setOwn(true)} style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
              <T v="strong" color={c.accent}>
                {query.trim() && !results.length ? `Not found. Add "${query.trim()}" yourself` : 'Add my own food'}
              </T>
            </TouchableOpacity>
          ) : (
            <>
              <Field label="Calories" keyboardType="number-pad" value={calories} onChangeText={setCalories} maxLength={5} hint="Check the packet if you have it" />
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                  <Field label="Protein g" keyboardType="decimal-pad" value={protein} onChangeText={setProtein} maxLength={5} />
                </View>
                <View style={{ flex: 1, marginLeft: -16 }}>
                  <Field label="Carbs g" keyboardType="decimal-pad" value={carbs} onChangeText={setCarbs} maxLength={5} />
                </View>
                <View style={{ flex: 1, marginLeft: -16 }}>
                  <Field label="Fat g" keyboardType="decimal-pad" value={fat} onChangeText={setFat} maxLength={5} />
                </View>
              </View>
            </>
          )}
          <T v="caption" style={{ paddingHorizontal: 16, marginTop: 8 }}>
            Food values: Indian Nutrient Databank (INDB, CC BY 4.0) and USDA FoodData Central. Home cooking can differ.
          </T>
        </>
      )}
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
      <Pick label="What did you do?" options={ACTIVITIES} value={name} onChange={setName} meta={pickIcon} />
      <Field label="For how many minutes?" keyboardType="number-pad" value={minutes} onChangeText={setMinutes} autoFocus />
    </Form>
  );
};

export const GoalsForm: React.FC<Nav> = ({ navigation }) => {
  const { targetSteps, targetWaterMl, targetCalories, targetProtein, weightGoal, setTargets, waterReminders, setWaterReminders } = useHealthStore(useShallow(({ targetSteps, targetWaterMl, targetCalories, targetProtein, weightGoal, setTargets, waterReminders, setWaterReminders }) => ({ targetSteps, targetWaterMl, targetCalories, targetProtein, weightGoal, setTargets, waterReminders, setWaterReminders })));
  const profile = useProfileStore((s) => s.profile);
  const [goal, setGoal] = useState<string>(weightGoal);
  const [protein, setProtein] = useState(String(targetProtein));
  const base = goalsFor(profile.gender ?? '', profile.activity ?? '', profile.weightKg).targetCalories;
  const pickGoal = (g: string) => {
    setGoal(g);
    setCalories(String(base + (g === 'Lose weight' ? -500 : g === 'Gain weight' ? 300 : 0)));
    if (profile.weightKg) setProtein(String(Math.round(profile.weightKg * (g === 'Keep weight' ? 1 : g === 'Lose weight' ? 1.2 : 1.6))));
  };
  const [remind, setRemind] = useState(waterReminders);
  const [steps, setSteps] = useState(String(targetSteps));
  const [water, setWater] = useState(String(targetWaterMl / 1000));
  const [calories, setCalories] = useState(String(targetCalories));

  const save = () => {
    setTargets({
      targetSteps: Math.round(num(steps)) || targetSteps,
      targetWaterMl: Math.round((num(water) || targetWaterMl / 1000) * 1000),
      targetCalories: Math.round(num(calories)) || targetCalories,
      targetProtein: Math.round(num(protein)) || targetProtein,
      weightGoal: goal as 'Lose weight' | 'Keep weight' | 'Gain weight',
    });
    setWaterReminders(remind);
    navigation.goBack();
  };

  return (
    <Form title="Daily goals" onCancel={() => navigation.goBack()} onSave={save}>
      <Field label="Steps" keyboardType="number-pad" value={steps} onChangeText={setSteps} />
      <Field label="Water in litres" keyboardType="decimal-pad" value={water} onChangeText={setWater} maxLength={4} />
      <ToggleRow title="Remind me to drink water" subtitle="Every 2 hours from 10 AM to 8 PM" value={remind} onChange={setRemind} last />
      <View style={{ height: 18 }} />
      <View style={{ marginBottom: 18 }}>
        <T v="section" style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          Your goal
        </T>
        <Segmented options={['Lose weight', 'Keep weight', 'Gain weight']} value={goal} onChange={pickGoal} style={{ marginHorizontal: 16 }} />
      </View>
      <Field label="Calories a day" keyboardType="number-pad" value={calories} onChangeText={setCalories} maxLength={4} hint={`About ${base} kcal keeps your weight steady. Eating 500 less a day loses about 0.5 kg a week.`} />
      <Field label="Protein a day (grams)" keyboardType="number-pad" value={protein} onChangeText={setProtein} maxLength={3} hint={profile.weightKg ? 'Set from your weight. 1 to 1.6 g per kg is a common range.' : 'Add your weight in your profile for a better number.'} />
      <T v="caption" style={{ paddingHorizontal: 16 }}>
        These are general guides, not medical advice. Talk to a doctor before big diet changes.
      </T>
    </Form>
  );
};
