import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { View } from 'react-native';
import { Droplets, Footprints, Pill, Utensils, Target, Minus, Dumbbell, X } from 'lucide-react-native';
import { Screen, AppBar, Section, Row, T, IconCircle } from '../ui/kit';
import { TouchableOpacity } from '../components/Touchable';
import { useColors } from '../core/theme';
import { localDate } from '../core/date';
import { useHealthStore } from '../modules/health/healthStore';
import { useLifeStore, lowStock } from '../modules/life/lifeStore';
import { confirmAction } from '../core/confirm';
import { suggestFoods } from '../core/food';
import { useProfileStore } from '../modules/profile/profileStore';
import { useFitnessStore } from '../modules/fitness/fitnessStore';

const CUPS = [
  ['Glass', 250],
  ['Mug', 350],
  ['Bottle', 500],
] as const;

const WeekChart: React.FC<{ values: { day: string; value: number }[]; goal: number; color: string; format: (n: number) => string }> = ({ values, goal, color, format }) => {
  const c = useColors();
  const [picked, setPicked] = useState(values[values.length - 1]?.day);
  const max = Math.max(goal, ...values.map((v) => v.value), 1);
  const shown = values.find((v) => v.day === picked) ?? values[values.length - 1];
  const label = shown ? (shown.day === localDate() ? 'Today' : new Date(`${shown.day}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })) : '';
  return (
    <View style={{ marginTop: 14 }}>
      {shown ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <T v="caption">{label}</T>
          <T v="caption" color={shown.value >= goal ? c.income : c.ink} style={{ fontWeight: '700' }}>
            {format(shown.value)}
            {shown.value >= goal ? ' · goal met' : ''}
          </T>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 84 }}>
        {values.map((v) => (
          <TouchableOpacity key={v.day} onPress={() => setPicked(v.day)} style={{ flex: 1, alignItems: 'center', gap: 4 }} accessibilityLabel={`${v.day}: ${format(v.value)}`}>
            <View style={{ width: '70%', height: 64, justifyContent: 'flex-end', backgroundColor: c.soft, borderRadius: 6, overflow: 'hidden', borderWidth: v.day === shown?.day ? 1.5 : 0, borderColor: c.shade(color) }}>
              <View style={{ height: `${(v.value / max) * 100}%`, backgroundColor: v.value >= goal ? c.shade(color) : c.shade(color) + '88', borderRadius: 5 }} />
            </View>
            <T v="caption" color={v.day === shown?.day ? c.ink : undefined} style={{ fontSize: 11, fontWeight: v.day === shown?.day ? '700' : '400' }}>
              {new Date(`${v.day}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'narrow' })}
            </T>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const lastWeek = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return localDate(d);
  });

const Tracker: React.FC<{ icon: any; color: string; title: string; value: string; goal: string; pct: number; children?: React.ReactNode; last?: boolean; below?: React.ReactNode }> = ({
  icon,
  color,
  title,
  value,
  goal,
  pct,
  children,
  last,
  below,
}) => {
  const c = useColors();
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: last ? 0 : 0.5, borderBottomColor: c.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <IconCircle icon={icon} color={color} />
        <View style={{ flex: 1 }}>
          <T v="strong">{title}</T>
          <T v="sub">
            {value} of {goal}
          </T>
        </View>
        {children}
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.soft, marginTop: 12, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${Math.min(100, pct)}%`, backgroundColor: c.shade(color) }} />
      </View>
      {below}
    </View>
  );
};

export const HealthScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const today = localDate();
  const h = useHealthStore(useShallow(({ history, logWater, meals, removeMeal, steps, targetCalories, targetProtein, targetSteps, targetWaterMl, waterMl, weightGoal }) => ({ history, logWater, meals, removeMeal, steps, targetCalories, targetProtein, targetSteps, targetWaterMl, waterMl, weightGoal })));
  const workouts = useFitnessStore((s) => s.workouts);
  const lastWorkout = workouts[0];
  const gymSub = lastWorkout ? `Last: ${lastWorkout.title} · ${lastWorkout.date === localDate() ? 'today' : new Date(`${lastWorkout.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Log sets and reps, see your progress';
  const { medicines, medTaken, toggleTaken } = useLifeStore(useShallow(({ medicines, medTaken, toggleTaken }) => ({ medicines, medTaken, toggleTaken })));
  const takenToday = medTaken[today] ?? [];
  const week = lastWeek();
  const past = Object.fromEntries(h.history.map((x) => [x.day, x]));
  const doseNote = (m: (typeof medicines)[number]) => {
    const since = Number(m.id.split('-')[1]) || 0;
    const days = week.slice(0, 6).filter((d) => new Date(`${d}T23:59:59`).getTime() >= since);
    if (days.length < 2) return '';
    const full = days.filter((d) => m.times.every((t) => (medTaken[d] ?? []).includes(`${m.id}@${t}`))).length;
    return `All doses taken on ${full} of the last ${days.length} days`;
  };
  const calories = h.meals.reduce((s, m) => s + m.calories, 0);
  const protein = h.meals.reduce((s, m) => s + (m.proteinG || 0), 0);
  const over = calories > h.targetCalories;
  const diet = useProfileStore((s) => s.profile.diet);
  const ideas = suggestFoods(h.targetCalories - calories, h.targetProtein - protein, diet ?? '');

  return (
    <Screen>
      <AppBar title="Health" right={[{ icon: Target, label: 'Daily goals', onPress: () => navigation.navigate('GoalsForm') }]} />

      <Section title="Today">
        <Tracker
          icon={Droplets}
          color="#0284C7"
          title="Water"
          value={`${(h.waterMl / 1000).toFixed(2).replace(/0$/, '')} L`}
          goal={`${(h.targetWaterMl / 1000).toFixed(1)} L`}
          pct={(h.waterMl / h.targetWaterMl) * 100}
          below={
            <>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {CUPS.map(([name, ml]) => (
                  <TouchableOpacity key={name} onPress={() => h.logWater(ml)} accessibilityLabel={`Add a ${name.toLowerCase()}, ${ml} ml`} style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
                    <T v="sub" color={c.ink} style={{ fontWeight: '700' }}>
                      + {name}
                    </T>
                    <T v="caption" style={{ fontSize: 11 }}>
                      {ml} ml
                    </T>
                  </TouchableOpacity>
                ))}
              </View>
              <WeekChart values={week.map((d) => ({ day: d, value: d === today ? h.waterMl : past[d]?.waterMl ?? 0 }))} goal={h.targetWaterMl} color="#0284C7" format={(n) => `${(n / 1000).toFixed(1)} L`} />
            </>
          }
        >
          <TouchableOpacity onPress={() => h.logWater(-250)} disabled={h.waterMl === 0} accessibilityLabel="Remove a glass" style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.soft, opacity: h.waterMl === 0 ? 0.4 : 1 }}>
            <Minus size={20} color={c.ink} />
          </TouchableOpacity>
        </Tracker>
        <Tracker
          icon={Footprints}
          color="#059669"
          title="Steps"
          value={h.steps.toLocaleString('en-IN')}
          goal={h.targetSteps.toLocaleString('en-IN')}
          pct={(h.steps / h.targetSteps) * 100}
          last
          below={<WeekChart values={week.map((d) => ({ day: d, value: d === today ? h.steps : past[d]?.steps ?? 0 }))} goal={h.targetSteps} color="#059669" format={(n) => `${n.toLocaleString('en-IN')} steps`} />}
        />
      </Section>

      <Section title="Medicines" action={{ label: 'Add', onPress: () => navigation.navigate('MedicineForm') }}>
        {medicines.length === 0 ? (
          <Row icon={Pill} iconColor="#DB2777" title="Add a medicine" subtitle="Get a reminder at each dose time" chevron onPress={() => navigation.navigate('MedicineForm')} last />
        ) : (
          medicines.map((m, i) => (
            <View key={m.id}>
              <Row
                icon={Pill}
                iconColor="#DB2777"
                title={m.name}
                subtitle={[[m.dose, m.note].filter(Boolean).join(' · ') || (m.times.length === 1 ? 'Once a day' : m.times.length === 2 ? 'Twice a day' : `${m.times.length} times a day`), doseNote(m)].filter(Boolean).join('\n')}
                rightText={m.stock !== undefined ? `${m.stock} left` : undefined}
                rightColor={lowStock(m) ? c.expense : undefined}
                onPress={() => navigation.navigate('MedicineForm', { id: m.id })}
                last
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 74, paddingRight: 16, paddingBottom: 14, borderBottomWidth: i === medicines.length - 1 ? 0 : 0.5, borderBottomColor: c.line }}>
                {m.times.map((t) => {
                  const taken = takenToday.includes(`${m.id}@${t}`);
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => toggleTaken(m.id, t)}
                      accessibilityLabel={`${m.name} at ${t}, ${taken ? 'taken' : 'not taken'}`}
                      style={{ paddingHorizontal: 14, height: 38, borderRadius: 19, justifyContent: 'center', backgroundColor: taken ? c.income : c.soft }}
                    >
                      <T v="sub" color={taken ? '#FFFFFF' : c.ink} style={{ fontWeight: '700' }}>
                        {taken ? `✓ ${t}` : t}
                      </T>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </Section>

      <Section title="Food today" action={{ label: 'Add food', onPress: () => navigation.navigate('MealForm') }}>
        <View style={{ padding: 16, gap: 12 }}>
          {[
            ['Calories', calories, h.targetCalories, 'kcal', '#EA580C'],
            ['Protein', protein, h.targetProtein, 'g', '#2563EB'],
          ].map(([label, value, goal, unit, color]) => (
            <View key={label as string}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <T v="sub">{label as string}</T>
                <T v="sub" color={(value as number) > (goal as number) && label === 'Calories' ? c.expense : c.ink} style={{ fontWeight: '700' }}>
                  {Math.round(value as number)} / {goal as number} {unit as string}
                </T>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: c.soft, overflow: 'hidden' }}>
                <View style={{ height: 8, width: `${Math.min(100, ((value as number) / (goal as number)) * 100)}%`, backgroundColor: c.shade(color as string) }} />
              </View>
            </View>
          ))}
        </View>
        {h.meals.map((m, i) => (
          <Row
            key={m.id}
            icon={Utensils}
            iconColor="#EA580C"
            title={m.name}
            subtitle={`${m.mealType} · ${m.time}${m.proteinG ? ` · ${m.proteinG} g protein` : ''}`}
            rightText={m.calories ? `${m.calories} kcal` : undefined}
            right={
              <TouchableOpacity onPress={() => confirmAction('Remove this?', m.name, 'Remove', () => h.removeMeal(m.id))} accessibilityLabel={`Remove ${m.name}`} style={{ padding: 8 }}>
                <X size={18} color={c.textFaint} />
              </TouchableOpacity>
            }
            last={i === h.meals.length - 1 && !ideas.length && !over}
          />
        ))}
        {over ? (
          <T v="sub" color={c.warn} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            You are {Math.round(calories - h.targetCalories)} kcal over today's goal. Keep the next meal light, like dal with salad, or skip snacks.
          </T>
        ) : null}
        {ideas.length ? (
          <View style={{ padding: 16, paddingTop: 4 }}>
            <T v="section" style={{ marginBottom: 8 }}>
              {h.weightGoal === 'Gain weight' ? 'To reach your goal, add' : 'Good next picks for your goal'}
            </T>
            {ideas.map((f) => (
              <TouchableOpacity key={f.name} onPress={() => navigation.navigate('MealForm')} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <T v="strong" lines={1}>
                    {f.name}
                  </T>
                  <T v="caption">
                    1 {f.serving} · {f.protein} g protein
                  </T>
                </View>
                <T v="sub" style={{ fontWeight: '700' }}>
                  {f.kcal} kcal
                </T>
              </TouchableOpacity>
            ))}
            <T v="caption" style={{ marginTop: 4 }}>
              {Math.max(0, Math.round(h.targetCalories - calories))} kcal and {Math.max(0, Math.round(h.targetProtein - protein))} g protein left today. General guidance, not medical advice.
            </T>
          </View>
        ) : null}
      </Section>

      <Section title="Gym">
        <Row icon={Dumbbell} iconColor="#2563EB" title="Gym and workouts" subtitle={gymSub} chevron onPress={() => navigation.navigate('Gym')} last />
      </Section>

    </Screen>
  );
};
