import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { View } from 'react-native';
import {
  Droplets,
  ArrowUpRight,
  ListTodo,
  Pill,
  ShoppingCart,
  Receipt,
  Bell,
  CalendarDays,
  Cake,
  Footprints,
  Wallet,
  CloudSun,
  Camera,
  CircleUser,
  Sparkles,
  Plus,
  Utensils,
} from 'lucide-react-native';
import { Screen, AppBar, Section, Row, T, Avatar, Icon, Button, Fab, ActionSheet } from '../ui/kit';
import Svg, { Circle } from 'react-native-svg';
import { useProfileStore } from '../modules/profile/profileStore';
import { TouchableOpacity } from '../components/Touchable';
import { SaraloWordmark } from '../components/SaraloLogo';
import { useColors } from '../core/theme';
import { localDate, parseTime, formatTime } from '../core/date';
import { useFinanceOpsStore, DayOfWeek } from '../modules/finance/financeStore';
import { useWalletStore } from '../modules/wallet/walletStore';
import { useHealthStore } from '../modules/health/healthStore';
import { useStyleStore } from '../modules/style/styleStore';
import { useLifeStore, daysUntil, billDueDate } from '../modules/life/lifeStore';
import { rupees } from './money/moneyMeta';

const WEEKDAYS: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Ring: React.FC<{ pct: number; color: string; icon: Icon; value: string; label: string; onPress: () => void }> = ({ pct, color, icon: I, value, label, onPress }) => {
  const c = useColors();
  const size = 76;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  const shown = c.shade(color);
  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={`${label}: ${value}`} style={{ flex: 1, alignItems: 'center', paddingVertical: 16 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.soft} strokeWidth={stroke} fill="none" />
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={shown} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${length} ${length}`} strokeDashoffset={length * (1 - Math.min(1, Math.max(0, pct)))} />
        </Svg>
        <I size={26} color={shown} />
      </View>
      <T v="strong" style={{ marginTop: 8 }} lines={1}>
        {value}
      </T>
      <T v="caption" lines={1}>
        {label}
      </T>
    </TouchableOpacity>
  );
};

type Item = { key: string; minutes: number | null; done?: boolean; title?: string; sub?: string; action?: { label: string; run: () => void }; render: (last: boolean) => React.ReactElement };

const When: React.FC<{ minutes: number | null; color: string }> = ({ minutes, color }) => {
  const c = useColors();
  const [clock, half] = minutes === null ? ['Any', 'time'] : formatTime(minutes).split(' ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 44, alignItems: 'flex-end' }}>
        <T v="strong" style={{ fontSize: 15 }}>
          {clock}
        </T>
        <T v="caption" style={{ fontSize: 11 }}>
          {half}
        </T>
      </View>
      <View style={{ width: 4, height: 38, borderRadius: 2, backgroundColor: c.shade(color) }} />
    </View>
  );
};

export const TodayScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const today = localDate();
  const now = new Date();
  const { todos, toggleTodo, calendarEvents, alarms } = useFinanceOpsStore(useShallow(({ todos, toggleTodo, calendarEvents, alarms }) => ({ todos, toggleTodo, calendarEvents, alarms })));
  const { transactions } = useWalletStore(useShallow(({ transactions }) => ({ transactions })));
  const { steps, targetSteps, waterMl, targetWaterMl, logWater } = useHealthStore(useShallow(({ steps, targetSteps, waterMl, targetWaterMl, logWater }) => ({ steps, targetSteps, waterMl, targetWaterMl, logWater })));
  const weather = useStyleStore((s) => s.weather);
  const detectWeather = useStyleStore((s) => s.detectLocationAndWeather);
  const photo = useProfileStore((s) => s.profile.profilePhotoUri);

  useEffect(() => {
    if (weather.isLive) detectWeather().catch(() => {});
  }, []);
  const { medicines, medTaken, toggleTaken, bills, specialDays } = useLifeStore(useShallow(({ medicines, medTaken, toggleTaken, bills, specialDays }) => ({ medicines, medTaken, toggleTaken, bills, specialDays })));

  const weekday = WEEKDAYS[now.getDay()];
  const takenToday = medTaken[today] ?? [];
  const monthlyBudget = useWalletStore((s) => s.monthlyBudget);
  const dailyBudget = monthlyBudget ? Math.round(monthlyBudget / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) : 0;
  const spentToday = transactions.filter((t) => t.type === 'EXPENSE' && t.date === today).reduce((s, t) => s + t.amount, 0);
  const month = today.slice(0, 7);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const passed = (t?: string) => {
    const m = parseTime(t);
    return m !== null && m < nowMin;
  };
  const [adding, setAdding] = useState(false);
  const items: Item[] = [
    ...todos
      .filter((t) => t.dueDate === today || (t.dueDate < today && !t.isCompleted))
      .map((t) => ({
        key: t.id,
        minutes: parseTime(t.dueTime),
        done: t.isCompleted,
        title: t.title,
        sub: t.dueDate < today ? 'Overdue to-do' : 'To-do',
        action: { label: 'Done', run: () => toggleTodo(t.id) },
        render: (last: boolean) => (
          <Row
            key={t.id}
            leading={<When minutes={parseTime(t.dueTime)} color={t.dueDate < today ? '#E11D48' : '#0F766E'} />}
            title={t.title}
            subtitle={t.dueDate < today ? 'Overdue' : t.category}
            checked={t.isCompleted}
            onCheck={() => toggleTodo(t.id)}
            strike={t.isCompleted}
            onPress={() => navigation.navigate('TodoForm', { id: t.id })}
            last={last}
          />
        ),
      })),
    ...calendarEvents
      .filter((e) => e.date === today && !passed(e.endTime || e.startTime))
      .map((e) => ({
        key: e.id,
        minutes: parseTime(e.startTime),
        title: e.title,
        sub: e.location ? `Event · ${e.location}` : 'Event',
        render: (last: boolean) => (
          <Row
            key={e.id}
            leading={<When minutes={parseTime(e.startTime)} color="#0891B2" />}
            title={e.title}
            subtitle={e.location || 'Event'}
            onPress={() => navigation.navigate('EventForm', { id: e.id })}
            last={last}
          />
        ),
      })),
    ...alarms
      .filter((a) => a.isEnabled && (a.days.length === 0 || a.days.includes(weekday)) && !passed(a.time))
      .map((a) => ({
        key: a.id,
        minutes: parseTime(a.time),
        title: a.label,
        sub: 'Reminder',
        render: (last: boolean) => (
          <Row key={a.id} leading={<When minutes={parseTime(a.time)} color="#D97706" />} title={a.label} subtitle="Reminder" onPress={() => navigation.navigate('ReminderForm', { id: a.id })} last={last} />
        ),
      })),
    ...medicines.flatMap((m) =>
      m.times.map((time) => {
        const taken = takenToday.includes(`${m.id}@${time}`);
        return {
          key: `${m.id}@${time}`,
          minutes: parseTime(time),
          done: taken,
          title: m.name,
          sub: m.dose ? `Medicine · ${m.dose}` : 'Medicine',
          action: { label: 'Take', run: () => toggleTaken(m.id, time) },
          render: (last: boolean) => (
            <Row
              key={`${m.id}@${time}`}
              leading={<When minutes={parseTime(time)} color="#DB2777" />}
              title={m.name}
              subtitle={[m.dose || 'Medicine', !taken && passed(time) ? 'not taken yet' : ''].filter(Boolean).join(' · ')}
              last={last}
              right={
                <TouchableOpacity
                  onPress={() => toggleTaken(m.id, time)}
                  style={{ paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: 'center', backgroundColor: taken ? c.soft : c.accent }}
                >
                  <T v="sub" color={taken ? c.income : '#FFFFFF'} style={{ fontWeight: '700' }}>
                    {taken ? 'Taken' : 'Take'}
                  </T>
                </TouchableOpacity>
              }
            />
          ),
        };
      })
    ),
  ].sort((a, b) => (a.minutes ?? -1) - (b.minutes ?? -1));

  const upcoming = [
    ...bills
      .filter((b) => !b.paidMonths.includes(month))
      .map((b) => {
        const due = billDueDate(b, now);
        const days = Math.round((due.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
        return { key: b.id, days, title: b.name, sub: `${b.amount ? rupees(b.amount) + ' · ' : ''}${days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `Due in ${days} days`}`, icon: Receipt, color: '#CA8A04', go: () => navigation.navigate('Bills') };
      }),
    ...specialDays.map((d) => {
      const days = daysUntil(d.date, now);
      return { key: d.id, days, title: `${d.name}'s ${d.kind === 'Other' ? 'day' : d.kind.toLowerCase()}`, sub: days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`, icon: Cake, color: '#C026D3', go: () => navigation.navigate('SpecialDaysList') };
    }),
  ]
    .filter((x) => x.days <= 7)
    .sort((a, b) => a.days - b.days);

  const next = items.find((it) => !it.done && it.minutes !== null && it.minutes >= nowMin - 60);
  const timeOf = (m: number | null) => (m === null ? null : formatTime(m));
  const longDate = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const isNew = todos.length === 0 && transactions.length === 0 && medicines.length === 0 && waterMl === 0;

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppBar
          title="Saralo"
          logo={<SaraloWordmark color={c.ink} />}
          right={[
            { icon: Camera, label: 'Save a bill photo', onPress: () => navigation.navigate('VaultForm', { type: 'bills', scan: true }) },
            { icon: CircleUser, node: photo ? <Avatar name="" uri={photo} size={32} /> : undefined, label: 'Your profile', onPress: () => navigation.navigate('Profile') },
          ]}
        />

        <T v="sub" style={{ paddingHorizontal: 16, marginTop: -4 }}>
          {longDate}
          {weather.isLive ? ` · ${Math.round(weather.temperature)}° ${weather.condition.toLowerCase()}${weather.needsUmbrella ? ' · take an umbrella' : ''}` : ''}
        </T>

        {next ? (
          <View style={{ marginHorizontal: 16, marginTop: 16, padding: 18, borderRadius: 24, backgroundColor: c.accentSoft }}>
            <T v="caption" color={c.accent} style={{ fontWeight: '800', letterSpacing: 0.5 }}>
              {next.minutes! < nowMin ? 'DUE NOW' : `NEXT UP · ${timeOf(next.minutes)}`}
            </T>
            <T v="title" style={{ marginTop: 6, fontSize: 24 }} lines={2}>
              {next.title}
            </T>
            <T v="sub" style={{ marginTop: 2 }}>
              {next.sub}
            </T>
            {next.action ? <Button title={next.action.label} style={{ marginTop: 14, height: 48 }} onPress={next.action.run} /> : null}
          </View>
        ) : null}

        {isNew ? (
          <Section title="Start here">
            <Row icon={ListTodo} iconColor="#4F46E5" title="Add your first to-do" subtitle="Something you need to do today" chevron onPress={() => navigation.navigate('TodoForm')} />
            <Row icon={Pill} iconColor="#DB2777" title="Add a medicine reminder" subtitle="We will remind you on time" chevron onPress={() => navigation.navigate('MedicineForm')} />
            <Row icon={Wallet} iconColor="#E11D48" title="Write down something you spent" subtitle="See where your money goes" chevron onPress={() => navigation.navigate('TransactionForm', { kind: 'Spent' })} last />
          </Section>
        ) : null}

        <Section title="Today" action={{ label: 'Planner', onPress: () => navigation.navigate('Planner') }}>
          {items.length === 0 ? (
            <T v="sub" style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
              Nothing planned yet. Tap Add to put something on your day.
            </T>
          ) : (
            items.map((it, i) => it.render(i === items.length - 1))
          )}
        </Section>

        {upcoming.length > 0 ? (
          <Section title="Coming up this week">
            {upcoming.map((u, i) => (
              <Row key={u.key} icon={u.icon} iconColor={u.color} title={u.title} subtitle={u.sub} chevron onPress={u.go} last={i === upcoming.length - 1} />
            ))}
          </Section>
        ) : null}

        <Section title="At a glance">
          <View style={{ flexDirection: 'row', paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: c.line }}>
            <Ring pct={steps / targetSteps} color="#059669" icon={Footprints} value={steps.toLocaleString('en-IN')} label={`of ${targetSteps.toLocaleString('en-IN')} steps`} onPress={() => navigation.navigate('Health')} />
            <Ring pct={waterMl / targetWaterMl} color="#0284C7" icon={Droplets} value={`${(waterMl / 1000).toFixed(1)} L`} label={`of ${(targetWaterMl / 1000).toFixed(1)} L water`} onPress={() => navigation.navigate('Health')} />
            <Ring pct={dailyBudget ? spentToday / dailyBudget : 0} color="#E11D48" icon={Wallet} value={rupees(spentToday)} label={dailyBudget ? `of ${rupees(dailyBudget)} today` : 'spent today'} onPress={() => navigation.navigate('Money')} />
          </View>
          {weather.isLive ? null : <Row icon={CloudSun} iconColor="#F59E0B" title="Today's weather" subtitle="Tap to see the weather where you are" onPress={() => detectWeather().catch(() => {})} chevron />}
          <Row icon={Sparkles} iconColor="#7C3AED" title="What to wear today" subtitle={weather.isLive ? `For ${Math.round(weather.temperature)}° ${weather.condition.toLowerCase()}, from your own clothes` : "Ideas from your own clothes"} chevron onPress={() => navigation.navigate('Outfits')} last />
        </Section>
      </Screen>
      <Fab label="Add" icon={Plus} onPress={() => setAdding(true)} />
      <ActionSheet
        visible={adding}
        title="Add to your day"
        onClose={() => setAdding(false)}
        options={[
          { title: 'Money spent', sub: 'Write down an expense', icon: ArrowUpRight, color: '#E11D48', onPress: () => navigation.navigate('TransactionForm', { kind: 'Spent' }) },
          { title: 'A glass of water', sub: 'Adds 250 ml right away', icon: Droplets, color: '#0284C7', onPress: () => logWater(250) },
          { title: 'To-do', sub: 'Something you need to do', icon: ListTodo, color: '#0F766E', onPress: () => navigation.navigate('TodoForm') },
          { title: 'Food', sub: 'Calories are worked out for you', icon: Utensils, color: '#EA580C', onPress: () => navigation.navigate('MealForm') },
          { title: 'Medicine', sub: 'Get a reminder at each dose', icon: Pill, color: '#DB2777', onPress: () => navigation.navigate('MedicineForm') },
          { title: 'Shopping item', sub: 'Add to your list', icon: ShoppingCart, color: '#059669', onPress: () => navigation.navigate('ShoppingList') },
          { title: 'Monthly bill', sub: 'Rent, electricity, phone', icon: Receipt, color: '#CA8A04', onPress: () => navigation.navigate('BillForm') },
        ]}
      />
    </View>
  );
};