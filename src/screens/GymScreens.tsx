import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useShallow } from 'zustand/react/shallow';
import { View, TextInput, Modal, ScrollView, Platform, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dumbbell, Plus, Trophy, Trash2, X, Repeat, Check, Timer, TrendingUp } from 'lucide-react-native';
import { Screen, AppBar, Section, Row, Fab, Empty, T, Button, Chips, Form, Field, ToggleRow } from '../ui/kit';
import { TouchableOpacity } from '../components/Touchable';
import { useColors, useTextScale } from '../core/theme';
import { localDate } from '../core/date';
import { confirmAction } from '../core/confirm';
import { useFitnessStore, EXERCISES, WorkoutExercise, lastTime, bestLift, describeSets, estMax, muscleOf, suggestNext, liftHistory } from '../modules/fitness/fitnessStore';

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
  const { workouts, routines, deleteWorkout, deleteRoutine } = useFitnessStore(useShallow(({ workouts, routines, deleteWorkout, deleteRoutine }) => ({ workouts, routines, deleteWorkout, deleteRoutine })));
  const thisWeek = workouts.filter((w) => w.date >= weekStart());
  const mins = thisWeek.reduce((m, w) => m + w.minutes, 0);
  const names = [...new Set(workouts.flatMap((w) => w.exercises.map((e) => e.name)))];
  const bests = names
    .map((n) => ({ name: n, best: bestLift(workouts, n) }))
    .filter((b) => b.best && b.best.kg > 0)
    .sort((a, b) => b.best!.kg - a.best!.kg)
    .slice(0, 6);
  const c = useColors();
  const monday = weekStart();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${monday}T00:00:00`);
    d.setDate(d.getDate() + i);
    return localDate(d);
  });
  const trained = new Set(workouts.map((w) => w.date));
  let streak = 0;
  for (let k = 0; k < 52; k++) {
    const start = new Date(`${monday}T00:00:00`);
    start.setDate(start.getDate() - 7 * k);
    const from = localDate(start);
    start.setDate(start.getDate() + 6);
    const to = localDate(start);
    if (workouts.some((w) => w.date >= from && w.date <= to)) streak++;
    else if (k > 0) break;
  }
  const muscleSets = Object.entries(
    thisWeek.flatMap((w) => w.exercises).reduce<Record<string, number>>((acc, e) => ({ ...acc, [muscleOf(e.name)]: (acc[muscleOf(e.name)] || 0) + e.sets.length }), {})
  ).sort((a, b) => b[1] - a[1]);
  const maxSets = Math.max(10, ...muscleSets.map((m) => m[1]));

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppBar title="Gym" onBack={() => navigation.goBack()} />
        <View style={{ marginHorizontal: 16, padding: 16, borderRadius: 22, backgroundColor: c.card }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {week.map((d) => (
              <View key={d} style={{ alignItems: 'center', gap: 6 }}>
                <T v="caption">{new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'narrow' })}</T>
                <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: trained.has(d) ? c.accent : c.soft, borderWidth: d === localDate() ? 1.5 : 0, borderColor: c.accent }}>
                  {trained.has(d) ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : <T v="caption">{Number(d.slice(8))}</T>}
                </View>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            {[
              [String(thisWeek.length), thisWeek.length === 1 ? 'workout' : 'workouts'],
              [String(mins), 'minutes'],
              [String(streak), streak === 1 ? 'week streak' : 'weeks streak'],
            ].map(([n, l]) => (
              <View key={l} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: c.soft }}>
                <T v="h2">{n}</T>
                <T v="caption">{l}</T>
              </View>
            ))}
          </View>
        </View>

        {muscleSets.length ? (
          <Section title="Sets per muscle this week">
            <View style={{ padding: 16, gap: 10 }}>
              {muscleSets.map(([m, n]) => (
                <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <T v="sub" style={{ width: 80 }}>
                    {m}
                  </T>
                  <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: c.soft, overflow: 'hidden' }}>
                    <View style={{ width: `${(n / maxSets) * 100}%`, height: 10, borderRadius: 5, backgroundColor: n >= 10 ? c.income : c.accent }} />
                  </View>
                  <T v="strong" style={{ width: 28, textAlign: 'right' }}>
                    {n}
                  </T>
                </View>
              ))}
              <T v="caption">About 10 or more hard sets a week per muscle is a common goal for building strength.</T>
            </View>
          </Section>
        ) : null}

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
              <Row key={b.name} icon={Trophy} iconColor="#CA8A04" title={b.name} subtitle={`Best ${b.best!.kg} kg × ${b.best!.reps} · est. max ${estMax(b.best!)} kg`} chevron onPress={() => navigation.navigate('LiftHistory', { name: b.name })} last={i === bests.length - 1} />
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

type Draft = { name: string; sets: { kg: string; reps: string; done?: boolean }[] };

const REST_SECONDS = 90;

const RestTimer: React.FC<{ endsAt: number; onChange: (endsAt: number | null) => void }> = ({ endsAt, onChange }) => {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  useEffect(() => {
    if (left > 0) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Vibration.vibrate([0, 300, 150, 300]);
    onChange(null);
  }, [left]);
  const btn = (label: string, onPress: () => void) => (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 14, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center' }} accessibilityLabel={label}>
      <T v="strong" color="#FFFFFF">
        {label}
      </T>
    </TouchableOpacity>
  );
  return (
    <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12 + insets.bottom, borderRadius: 20, backgroundColor: c.accent, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 8 }}>
      <Timer size={22} color="#FFFFFF" />
      <T v="h2" color="#FFFFFF" style={{ flex: 1 }}>
        Rest {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </T>
      {btn('−15', () => onChange(Math.max(Date.now() + 1000, endsAt - 15000)))}
      {btn('+15', () => onChange(endsAt + 15000))}
      {btn('Skip', () => onChange(null))}
    </View>
  );
};

const toDraft = (e: WorkoutExercise): Draft => ({ name: e.name, sets: e.sets.map((s) => ({ kg: s.kg ? String(s.kg) : '', reps: s.reps ? String(s.reps) : '' })) });

export const WorkoutForm: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const c = useColors();
  const { workouts, routines, saveWorkout, saveRoutine } = useFitnessStore(useShallow(({ workouts, routines, saveWorkout, saveRoutine }) => ({ workouts, routines, saveWorkout, saveRoutine })));
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
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const others = existing ? workouts.filter((w) => w.id !== existing.id) : workouts;

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
          const best = bestLift(others, d.name);
          return (
            <View key={`${d.name}-${i}`} style={{ paddingHorizontal: 16, marginBottom: 22 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <T v="strong">{d.name}</T>
                  <T v="caption">{prev ? `Last time: ${describeSets(prev)}` : 'First time doing this'}</T>
                  {!existing && suggestNext(prev) ? (
                    <TouchableOpacity
                      onPress={() => {
                        const sg = suggestNext(prev)!;
                        update(i, (x) => ({ ...x, sets: x.sets.map((y) => (y.done ? y : { ...y, kg: sg.kg ? String(sg.kg) : y.kg, reps: String(sg.reps) })) }));
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: c.accentSoft }}
                      accessibilityLabel="Use the suggested weight"
                    >
                      <TrendingUp size={14} color={c.accent} />
                      <T v="caption" color={c.accent} style={{ fontWeight: '700' }}>
                        Try {suggestNext(prev)!.kg ? `${suggestNext(prev)!.kg} kg × ` : ''}{suggestNext(prev)!.reps} · {suggestNext(prev)!.why}
                      </T>
                    </TouchableOpacity>
                  ) : null}
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
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, opacity: s.done ? 0.75 : 1 }}>
                  <View style={{ width: 40 }}>
                    <T v="strong">{k + 1}</T>
                    {best && Number(s.kg) > best.kg && Number(s.reps) > 0 ? (
                      <T v="caption" color={c.income} style={{ fontSize: 10, fontWeight: '700' }}>
                        BEST
                      </T>
                    ) : null}
                  </View>
                  <NumBox label={`Set ${k + 1} kg`} value={s.kg} onChange={(v) => update(i, (x) => ({ ...x, sets: x.sets.map((y, m) => (m === k ? { ...y, kg: v } : y)) }))} />
                  <NumBox label={`Set ${k + 1} reps`} value={s.reps} onChange={(v) => update(i, (x) => ({ ...x, sets: x.sets.map((y, m) => (m === k ? { ...y, reps: v } : y)) }))} />
                  <TouchableOpacity
                    onPress={() => {
                      update(i, (x) => ({ ...x, sets: x.sets.map((y, m) => (m === k ? { ...y, done: !y.done } : y)) }));
                      if (!s.done && (Number(s.reps) > 0 || Number(s.kg) > 0)) setRestUntil(Date.now() + REST_SECONDS * 1000);
                    }}
                    onLongPress={() => update(i, (x) => ({ ...x, sets: x.sets.filter((_, m) => m !== k) }))}
                    accessibilityLabel={s.done ? `Set ${k + 1} done. Long press to remove` : `Mark set ${k + 1} done. Long press to remove`}
                    style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: s.done ? c.income : c.soft }}
                  >
                    <Check size={18} color={s.done ? '#FFFFFF' : c.textMuted} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
              <Button
                title="Add set"
                variant="secondary"
                icon={Plus}
                style={{ height: 44, marginTop: 2 }}
                onPress={() => update(i, (x) => ({ ...x, sets: [...x.sets, { ...(x.sets[x.sets.length - 1] ?? { kg: '', reps: '' }), done: false }] }))}
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
      {restUntil ? <RestTimer endsAt={restUntil} onChange={setRestUntil} /> : null}
      <ExercisePicker visible={picking} onClose={() => setPicking(false)} onPick={addExercise} />
    </>
  );
};

const ExercisePicker: React.FC<{ visible: boolean; onClose: () => void; onPick: (name: string) => void }> = ({ visible, onClose, onPick }) => {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { customExercises, addCustomExercise } = useFitnessStore(useShallow(({ customExercises, addCustomExercise }) => ({ customExercises, addCustomExercise })));
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

export const LiftHistoryScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const c = useColors();
  const workouts = useFitnessStore((st) => st.workouts);
  const name: string = route.params?.name ?? '';
  const history = liftHistory(workouts, name);
  const top = Math.max(1, ...history.map((h) => h.max));
  const recent = history.slice(-12);
  return (
    <Screen padBottom={40}>
      <AppBar title={name} onBack={() => navigation.goBack()} />
      {history.length ? (
        <>
          <View style={{ marginHorizontal: 16, padding: 16, borderRadius: 22, backgroundColor: c.card }}>
            <T v="caption">Estimated max</T>
            <T v="big">{history[history.length - 1].max} kg</T>
            {recent.length > 1 ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110, marginTop: 14 }}>
                {recent.map((h, i) => (
                  <View key={`${h.date}-${i}`} style={{ width: 22, height: `${Math.max(6, (h.max / top) * 100)}%`, borderRadius: 6, backgroundColor: i === recent.length - 1 ? c.accent : c.accent + '77' }} />
                ))}
              </View>
            ) : null}
            <T v="caption" style={{ marginTop: 6 }}>
              {recent.length > 1 ? `Last ${recent.length} sessions. ` : 'Log this lift again to see a progress chart. '}Estimated with the Epley formula from your best set.
            </T>
          </View>
          <Section title="Sessions">
            {[...history].reverse().map((h, i, list) => (
              <Row key={`${h.date}-${i}`} title={dayLabel(h.date)} subtitle={`Best set ${h.best.kg} kg × ${h.best.reps} · volume ${Math.round(h.volume)} kg`} rightText={`${h.max} kg`} last={i === list.length - 1} />
            ))}
          </Section>
        </>
      ) : (
        <Empty icon={Dumbbell} title="No sets yet" text="Log this exercise in a workout to see your progress." />
      )}
    </Screen>
  );
};
