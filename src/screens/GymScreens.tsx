import React, { useMemo, useRef, useState } from 'react';
import { View, TextInput, Modal, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dumbbell, Plus, Trophy, Trash2, X, Repeat } from 'lucide-react-native';
import { Screen, AppBar, Section, Row, Fab, Empty, T, Button, Chips, Form, Field, ToggleRow } from '../ui/kit';
import { TouchableOpacity } from '../components/Touchable';
import { useColors, useTextScale } from '../core/theme';
import { localDate } from '../core/date';
import { confirmAction } from '../core/confirm';
import { useFitnessStore, EXERCISES, WorkoutExercise, lastTime, bestLift, describeSets } from '../modules/fitness/fitnessStore';

const weekStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDate(d);
};

const dayLabel = (date: string) => {
  const today = localDate();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (date === today) return 'Today';
  if (date === localDate(y)) return 'Yesterday';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

export const GymScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { workouts, routines, deleteWorkout, deleteRoutine } = useFitnessStore();
  const thisWeek = workouts.filter((w) => w.date >= weekStart());
  const mins = thisWeek.reduce((m, w) => m + w.minutes, 0);
  const names = [...new Set(workouts.flatMap((w) => w.exercises.map((e) => e.name)))];
  const bests = names
    .map((n) => ({ name: n, best: bestLift(workouts, n) }))
    .filter((b) => b.best && b.best.kg > 0)
    .sort((a, b) => b.best!.kg - a.best!.kg)
    .slice(0, 6);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppBar title="Gym" onBack={() => navigation.goBack()} />
        <View style={{ paddingHorizontal: 16, flexDirection: 'row', gap: 10, marginBottom: 8 }}>
          {[
            [String(thisWeek.length), thisWeek.length === 1 ? 'workout this week' : 'workouts this week'],
            [String(mins), mins === 1 ? 'minute this week' : 'minutes this week'],
          ].map(([n, l]) => (
            <Stat key={l} value={n} label={l} />
          ))}
        </View>

        <Section title="Start from a routine">
          {routines.length === 0 ? (
            <Row icon={Repeat} iconColor="#7C3AED" title="No routines yet" subtitle="Finish a workout and save it as a routine, like Push day" last />
          ) : (
            routines.map((r, i) => (
              <Row
                key={r.id}
                icon={Repeat}
                iconColor="#7C3AED"
                title={r.name}
                subtitle={r.exercises.join(', ')}
                chevron
                onPress={() => navigation.navigate('WorkoutForm', { routineId: r.id })}
                onLongPress={() => confirmAction('Delete routine?', r.name, 'Delete', () => deleteRoutine(r.id))}
                last={i === routines.length - 1}
              />
            ))
          )}
        </Section>

        {bests.length > 0 ? (
          <Section title="Your best lifts">
            {bests.map((b, i) => (
              <Row key={b.name} icon={Trophy} iconColor="#CA8A04" title={b.name} rightText={`${b.best!.kg} kg × ${b.best!.reps}`} last={i === bests.length - 1} />
            ))}
          </Section>
        ) : null}

        <Section title="History">
          {workouts.length === 0 ? (
            <Empty icon={Dumbbell} title="No workouts yet" text="Tap Start workout, add exercises and write down your sets as you go." />
          ) : (
            workouts.slice(0, 40).map((w, i) => (
              <Row
                key={w.id}
                icon={Dumbbell}
                iconColor="#2563EB"
                title={w.title}
                subtitle={`${dayLabel(w.date)} · ${w.exercises.length} ${w.exercises.length === 1 ? 'exercise' : 'exercises'}${w.minutes ? ` · ${w.minutes} min` : ''}`}
                chevron
                onPress={() => navigation.navigate('WorkoutForm', { workoutId: w.id })}
                onLongPress={() => confirmAction('Delete workout?', w.title, 'Delete', () => deleteWorkout(w.id))}
                last={i === Math.min(workouts.length, 40) - 1}
              />
            ))
          )}
        </Section>
        {workouts.length > 0 || routines.length > 0 ? (
          <T v="caption" center style={{ marginTop: 12 }}>
            Long-press a workout or routine to delete it.
          </T>
        ) : null}
      </Screen>
      <Fab label="Start workout" icon={Plus} onPress={() => navigation.navigate('WorkoutForm')} />
    </View>
  );
};

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.soft, borderRadius: 16, padding: 14 }}>
      <T v="big">{value}</T>
      <T v="sub">{label}</T>
    </View>
  );
};

const NumBox: React.FC<{ value: string; onChange: (v: string) => void; label: string }> = ({ value, onChange, label }) => {
  const c = useColors();
  const scale = useTextScale();
  return (
    <TextInput
      value={value}
      onChangeText={(v) => onChange(v.replace(/[^0-9.]/g, ''))}
      keyboardType="decimal-pad"
      accessibilityLabel={label}
      selectTextOnFocus
      style={[
        { flex: 1, height: 44, borderRadius: 12, backgroundColor: c.soft, color: c.ink, textAlign: 'center', fontSize: 17 * scale, fontWeight: '600' },
        Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
      ]}
    />
  );
};

type Draft = { name: string; sets: { kg: string; reps: string }[] };

const toDraft = (e: WorkoutExercise): Draft => ({ name: e.name, sets: e.sets.map((s) => ({ kg: s.kg ? String(s.kg) : '', reps: s.reps ? String(s.reps) : '' })) });

export const WorkoutForm: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const c = useColors();
  const { workouts, routines, saveWorkout, saveRoutine } = useFitnessStore();
  const existing = workouts.find((w) => w.id === route.params?.workoutId);
  const routine = routines.find((r) => r.id === route.params?.routineId);
  const started = useRef(Date.now());
  const [title, setTitle] = useState(existing?.title ?? routine?.name ?? '');
  const [items, setItems] = useState<Draft[]>(() =>
    existing
      ? existing.exercises.map(toDraft)
      : (routine?.exercises ?? []).map((name) => {
          const prev = lastTime(workouts, name);
          return { name, sets: (prev ?? [{ kg: 0, reps: 0 }]).map((s) => ({ kg: s.kg ? String(s.kg) : '', reps: s.reps ? String(s.reps) : '' })) };
        })
  );
  const [picking, setPicking] = useState(false);
  const [asRoutine, setAsRoutine] = useState(false);

  const update = (i: number, fn: (d: Draft) => Draft) => setItems(items.map((d, j) => (j === i ? fn(d) : d)));
  const addExercise = (name: string) => {
    const prev = lastTime(workouts, name);
    const first = prev?.[0];
    setItems([...items, { name, sets: [{ kg: first?.kg ? String(first.kg) : '', reps: first?.reps ? String(first.reps) : '' }] }]);
    setPicking(false);
  };

  const finish = () => {
    const exercises = items
      .map((d) => ({ name: d.name, sets: d.sets.map((s) => ({ kg: Number(s.kg) || 0, reps: Number(s.reps) || 0 })).filter((s) => s.reps > 0 || s.kg > 0) }))
      .filter((e) => e.sets.length > 0);
    const name = title.trim() || 'Workout';
    saveWorkout({
      id: existing?.id,
      title: name,
      date: existing?.date ?? localDate(),
      minutes: existing?.minutes ?? Math.max(1, Math.round((Date.now() - started.current) / 60000)),
      exercises,
    });
    if (asRoutine) saveRoutine({ name, exercises: exercises.map((e) => e.name) });
    navigation.goBack();
  };

  const cancel = () => {
    if (existing || items.length === 0) return navigation.goBack();
    confirmAction('Leave this workout?', 'Your sets will not be saved.', 'Leave', () => navigation.goBack());
  };

  const hasSets = items.some((d) => d.sets.some((s) => Number(s.reps) > 0 || Number(s.kg) > 0));

  return (
    <>
      <Form title={existing ? 'Edit workout' : 'Workout'} onCancel={cancel} onSave={finish} saveLabel={existing ? 'Save' : 'Finish'} canSave={hasSets}>
        <Field label="Name (optional)" value={title} onChangeText={setTitle} hint="For example: Push day, Legs, Full body" />
        {items.map((d, i) => {
          const prev = lastTime(workouts, d.name, existing?.id);
          return (
            <View key={`${d.name}-${i}`} style={{ paddingHorizontal: 16, marginBottom: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <T v="strong">{d.name}</T>
                  <T v="caption">{prev ? `Last time: ${describeSets(prev)}` : 'First time doing this'}</T>
                </View>
                <TouchableOpacity onPress={() => setItems(items.filter((_, j) => j !== i))} accessibilityLabel={`Remove ${d.name}`} style={{ padding: 8 }}>
                  <Trash2 size={20} color={c.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 6 }}>
                <T v="caption" style={{ width: 40 }}>
                  Set
                </T>
                <T v="caption" center style={{ flex: 1 }}>
                  kg
                </T>
                <T v="caption" center style={{ flex: 1 }}>
                  Reps
                </T>
                <View style={{ width: 36 }} />
              </View>
              {d.sets.map((s, k) => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <T v="strong" style={{ width: 40 }}>
                    {k + 1}
                  </T>
                  <NumBox label={`Set ${k + 1} kg`} value={s.kg} onChange={(v) => update(i, (x) => ({ ...x, sets: x.sets.map((y, m) => (m === k ? { ...y, kg: v } : y)) }))} />
                  <NumBox label={`Set ${k + 1} reps`} value={s.reps} onChange={(v) => update(i, (x) => ({ ...x, sets: x.sets.map((y, m) => (m === k ? { ...y, reps: v } : y)) }))} />
                  <TouchableOpacity
                    onPress={() => update(i, (x) => ({ ...x, sets: x.sets.filter((_, m) => m !== k) }))}
                    accessibilityLabel={`Remove set ${k + 1}`}
                    style={{ width: 36, alignItems: 'center' }}
                  >
                    <X size={18} color={c.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
              <Button
                title="Add set"
                variant="secondary"
                icon={Plus}
                style={{ height: 44, marginTop: 2 }}
                onPress={() => update(i, (x) => ({ ...x, sets: [...x.sets, { ...(x.sets[x.sets.length - 1] ?? { kg: '', reps: '' }) }] }))}
              />
            </View>
          );
        })}
        <Button title="Add exercise" icon={Dumbbell} style={{ marginHorizontal: 16 }} onPress={() => setPicking(true)} />
        {!existing && !routine && items.length > 0 ? (
          <View style={{ marginTop: 18 }}>
            <ToggleRow title="Save as a routine" subtitle="Start the same workout next time in one tap" value={asRoutine} onChange={setAsRoutine} icon={Repeat} iconColor="#7C3AED" last />
          </View>
        ) : null}
      </Form>
      <ExercisePicker visible={picking} onClose={() => setPicking(false)} onPick={addExercise} />
    </>
  );
};

const ExercisePicker: React.FC<{ visible: boolean; onClose: () => void; onPick: (name: string) => void }> = ({ visible, onClose, onPick }) => {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { customExercises, addCustomExercise } = useFitnessStore();
  const groups = useMemo(() => ({ ...EXERCISES, ...(customExercises.length ? { Mine: customExercises } : {}) }), [customExercises]);
  const [group, setGroup] = useState('Chest');
  const [custom, setCustom] = useState('');

  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    addCustomExercise(name);
    setCustom('');
    onPick(name);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <AppBar title="Add exercise" right={[{ icon: X, label: 'Close', onPress: onClose }]} />
        <Chips options={Object.keys(groups)} value={group} onChange={setGroup} style={{ paddingBottom: 8 }} />
        <ScrollView keyboardShouldPersistTaps="handled">
          {(groups as Record<string, string[]>)[group]?.map((name, i, list) => (
            <Row key={name} icon={Dumbbell} iconColor="#2563EB" title={name} onPress={() => onPick(name)} last={i === list.length - 1} />
          ))}
          <View style={{ marginTop: 18 }}>
            <Field label="Not in the list? Type it" value={custom} onChangeText={setCustom} returnKeyType="done" onSubmitEditing={addCustom} />
            <Button title="Add my exercise" variant="secondary" disabled={!custom.trim()} style={{ marginHorizontal: 16 }} onPress={addCustom} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
