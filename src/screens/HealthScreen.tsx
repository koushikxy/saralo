import React from 'react';
import { View } from 'react-native';
import { Droplets, Footprints, Moon, Pill, Utensils, Activity, Target, Minus, Plus, Trash2, Dumbbell } from 'lucide-react-native';
import { Screen, AppBar, Section, Row, T, IconCircle } from '../ui/kit';
import { TouchableOpacity } from '../components/Touchable';
import { useColors } from '../core/theme';
import { localDate } from '../core/date';
import { useHealthStore } from '../modules/health/healthStore';
import { useLifeStore } from '../modules/life/lifeStore';
import { confirmAction } from '../core/confirm';
import { useFitnessStore } from '../modules/fitness/fitnessStore';

const Stepper: React.FC<{ onMinus: () => void; onPlus: () => void; minusLabel: string; plusLabel: string }> = ({ onMinus, onPlus, minusLabel, plusLabel }) => {
  const c = useColors();
  const btn = { width: 44, height: 44, borderRadius: 22, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: c.soft };
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TouchableOpacity style={btn} onPress={onMinus} accessibilityLabel={minusLabel}>
        <Minus size={20} color={c.ink} />
      </TouchableOpacity>
      <TouchableOpacity style={[btn, { backgroundColor: c.accent }]} onPress={onPlus} accessibilityLabel={plusLabel}>
        <Plus size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const Tracker: React.FC<{ icon: any; color: string; title: string; value: string; goal: string; pct: number; children: React.ReactNode; last?: boolean }> = ({
  icon,
  color,
  title,
  value,
  goal,
  pct,
  children,
  last,
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
    </View>
  );
};

export const HealthScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const today = localDate();
  const h = useHealthStore();
  const workouts = useFitnessStore((s) => s.workouts);
  const lastWorkout = workouts[0];
  const gymSub = lastWorkout ? `Last: ${lastWorkout.title} · ${lastWorkout.date === localDate() ? 'today' : new Date(`${lastWorkout.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Log sets and reps, see your progress';
  const { medicines, medTaken, toggleTaken } = useLifeStore();
  const takenToday = medTaken[today] ?? [];
  const calories = h.meals.reduce((s, m) => s + m.calories, 0);
  const activitiesToday = h.activities.filter((a) => a.date === today);
  const minutes = activitiesToday.reduce((s, a) => s + a.minutes, 0);

  return (
    <Screen>
      <AppBar title="Health" right={[{ icon: Target, label: 'Daily goals', onPress: () => navigation.navigate('GoalsForm') }]} />

      <Section title="Today">
        <Tracker icon={Droplets} color="#0284C7" title="Water" value={`${(h.waterMl / 1000).toFixed(2).replace(/0$/, '')} L`} goal={`${(h.targetWaterMl / 1000).toFixed(1)} L`} pct={(h.waterMl / h.targetWaterMl) * 100}>
          <Stepper onMinus={() => h.logWater(-250)} onPlus={() => h.logWater(250)} minusLabel="Remove a glass" plusLabel="Add a glass" />
        </Tracker>
        <Tracker
          icon={Footprints}
          color="#059669"
          title={h.stepSensor ? 'Steps (counted by your phone)' : 'Steps'}
          value={h.steps.toLocaleString('en-IN')}
          goal={h.targetSteps.toLocaleString('en-IN')}
          pct={(h.steps / h.targetSteps) * 100}
        >
          <Stepper onMinus={() => h.setSteps(Math.max(0, h.steps - 500))} onPlus={() => h.addSteps(500)} minusLabel="Remove 500 steps" plusLabel="Add 500 steps" />
        </Tracker>
        <Tracker icon={Moon} color="#7C3AED" title="Sleep last night" value={`${h.sleepHours} h`} goal={`${h.targetSleepHours} h`} pct={(h.sleepHours / h.targetSleepHours) * 100} last>
          <Stepper onMinus={() => h.setSleep(Math.max(0, h.sleepHours - 0.5))} onPlus={() => h.setSleep(h.sleepHours + 0.5)} minusLabel="Less sleep" plusLabel="More sleep" />
        </Tracker>
      </Section>

      <Section title="Medicines" action={{ label: 'Add', onPress: () => navigation.navigate('MedicineForm') }}>
        {medicines.length === 0 ? (
          <Row icon={Pill} iconColor="#DB2777" title="Add a medicine" subtitle="Get a reminder at each dose time" chevron onPress={() => navigation.navigate('MedicineForm')} last />
        ) : (
          medicines.map((m, i) => (
            <View key={m.id}>
              <Row icon={Pill} iconColor="#DB2777" title={m.name} subtitle={[m.dose, m.note].filter(Boolean).join(' · ') || `${m.times.length} times a day`} onPress={() => navigation.navigate('MedicineForm', { id: m.id })} last />
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

      <Section title={`Food today${calories ? ` · ${calories} kcal of ${h.targetCalories}` : ''}`} action={{ label: 'Add', onPress: () => navigation.navigate('MealForm') }}>
        {h.meals.length === 0 ? (
          <Row icon={Utensils} iconColor="#EA580C" title="Log what you ate" subtitle="Calories are optional" chevron onPress={() => navigation.navigate('MealForm')} last />
        ) : (
          h.meals.map((m, i) => (
            <Row
              key={m.id}
              icon={Utensils}
              iconColor="#EA580C"
              title={m.name}
              subtitle={`${m.mealType} · ${m.time}`}
              rightText={m.calories ? `${m.calories} kcal` : undefined}
              onLongPress={() => confirmAction('Remove this meal?', m.name, 'Remove', () => h.removeMeal(m.id))}
              last={i === h.meals.length - 1}
            />
          ))
        )}
      </Section>

      <Section title="Gym">
        <Row icon={Dumbbell} iconColor="#2563EB" title="Gym and workouts" subtitle={gymSub} chevron onPress={() => navigation.navigate('Gym')} last />
      </Section>

      <Section title={`Activity today${minutes ? ` · ${minutes} min` : ''}`} action={{ label: 'Add', onPress: () => navigation.navigate('ActivityForm') }}>
        {activitiesToday.length === 0 ? (
          <Row icon={Activity} iconColor="#16A34A" title="Log a walk, yoga or workout" chevron onPress={() => navigation.navigate('ActivityForm')} last />
        ) : (
          activitiesToday.map((a, i) => (
            <Row
              key={a.id}
              icon={Activity}
              iconColor="#16A34A"
              title={a.name}
              rightText={`${a.minutes} min`}
              right={
                <TouchableOpacity onPress={() => h.deleteActivity(a.id)} accessibilityLabel="Delete" style={{ padding: 8 }}>
                  <Trash2 size={18} color={c.textFaint} />
                </TouchableOpacity>
              }
              last={i === activitiesToday.length - 1}
            />
          ))
        )}
      </Section>
    </Screen>
  );
};
