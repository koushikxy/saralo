import React, { useEffect } from 'react';
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
} from 'lucide-react-native';
import { Screen, AppBar, Quick, Section, Row, T } from '../ui/kit';
import { TouchableOpacity } from '../components/Touchable';
import { SaraloWordmark } from '../components/SaraloLogo';
import { useColors } from '../core/theme';
import { localDate, parseTime } from '../core/date';
import { useFinanceOpsStore, DayOfWeek } from '../modules/finance/financeStore';
import { useWalletStore } from '../modules/wallet/walletStore';
import { useHealthStore } from '../modules/health/healthStore';
import { useStyleStore } from '../modules/style/styleStore';
import { useLifeStore, daysUntil, billDueDate } from '../modules/life/lifeStore';
import { rupees } from './money/moneyMeta';

const WEEKDAYS: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Item = { key: string; minutes: number | null; render: (last: boolean) => React.ReactElement };

export const TodayScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const today = localDate();
  const now = new Date();
  const { todos, toggleTodo, calendarEvents, alarms } = useFinanceOpsStore();
  const { transactions } = useWalletStore();
  const { steps, targetSteps, waterMl, targetWaterMl, logWater } = useHealthStore();
  const weather = useStyleStore((s) => s.weather);
  const detectWeather = useStyleStore((s) => s.detectLocationAndWeather);

  useEffect(() => {
    if (weather.isLive) detectWeather().catch(() => {});
  }, []);
  const { medicines, medTaken, toggleTaken, bills, specialDays } = useLifeStore();

  const weekday = WEEKDAYS[now.getDay()];
  const takenToday = medTaken[today] ?? [];
  const spentToday = transactions.filter((t) => t.type === 'EXPENSE' && t.date === today).reduce((s, t) => s + t.amount, 0);
  const month = today.slice(0, 7);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const passed = (t?: string) => {
    const m = parseTime(t);
    return m !== null && m < nowMin;
  };
  const items: Item[] = [
    ...todos
      .filter((t) => t.dueDate === today || (t.dueDate < today && !t.isCompleted))
      .map((t) => ({
        key: t.id,
        minutes: parseTime(t.dueTime),
        render: (last: boolean) => (
          <Row
            key={t.id}
            title={t.title}
            subtitle={t.dueDate < today ? 'Overdue' : t.dueTime || 'Any time today'}
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
        render: (last: boolean) => (
          <Row
            key={e.id}
            icon={CalendarDays}
            iconColor="#0891B2"
            title={e.title}
            subtitle={[e.startTime, e.location].filter(Boolean).join(' · ')}
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
        render: (last: boolean) => (
          <Row key={a.id} icon={Bell} iconColor="#D97706" title={a.label} subtitle={a.time} onPress={() => navigation.navigate('ReminderForm', { id: a.id })} last={last} />
        ),
      })),
    ...medicines.flatMap((m) =>
      m.times.map((time) => {
        const taken = takenToday.includes(`${m.id}@${time}`);
        return {
          key: `${m.id}@${time}`,
          minutes: parseTime(time),
          render: (last: boolean) => (
            <Row
              key={`${m.id}@${time}`}
              icon={Pill}
              iconColor="#DB2777"
              title={m.name}
              subtitle={[time, m.dose, !taken && passed(time) ? 'not taken yet' : ''].filter(Boolean).join(' · ')}
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
      return { key: d.id, days, title: `${d.name}'s ${d.kind === 'Other' ? 'day' : d.kind.toLowerCase()}`, sub: days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`, icon: Cake, color: '#C026D3', go: () => navigation.navigate('Planner', { tab: 'Special days' }) };
    }),
  ]
    .filter((x) => x.days <= 7)
    .sort((a, b) => a.days - b.days);

  const isNew = todos.length === 0 && transactions.length === 0 && medicines.length === 0 && waterMl === 0;

  return (
    <Screen>
      <AppBar
        title="Saralo"
        logo={<SaraloWordmark color={c.ink} />}
        right={[
          { icon: Camera, label: 'Save a bill photo', onPress: () => navigation.navigate('VaultForm', { type: 'bills', scan: true }) },
          { icon: CircleUser, label: 'Profile and settings', onPress: () => navigation.navigate('More') },
        ]}
      />

      <Quick
        items={[
          { label: 'Water', icon: Droplets, color: '#0284C7', onPress: () => logWater(250) },
          { label: 'Spent', icon: ArrowUpRight, color: '#E11D48', onPress: () => navigation.navigate('TransactionForm', { kind: 'Spent' }) },
          { label: 'To-do', icon: ListTodo, color: '#4F46E5', onPress: () => navigation.navigate('TodoForm') },
          { label: 'Medicine', icon: Pill, color: '#DB2777', onPress: () => navigation.navigate('MedicineForm') },
          { label: 'Shopping', icon: ShoppingCart, color: '#059669', onPress: () => navigation.navigate('Planner', { tab: 'Shopping' }) },
          { label: 'Bill', icon: Receipt, color: '#CA8A04', onPress: () => navigation.navigate('BillForm') },
        ]}
      />

      {isNew ? (
        <Section title="Start here">
          <Row icon={ListTodo} iconColor="#4F46E5" title="Add your first to-do" subtitle="Something you need to do today" chevron onPress={() => navigation.navigate('TodoForm')} />
          <Row icon={Pill} iconColor="#DB2777" title="Add a medicine reminder" subtitle="We will remind you on time" chevron onPress={() => navigation.navigate('MedicineForm')} />
          <Row icon={Wallet} iconColor="#E11D48" title="Write down something you spent" subtitle="See where your money goes" chevron onPress={() => navigation.navigate('TransactionForm', { kind: 'Spent' })} last />
        </Section>
      ) : null}

      <Section title="Up next today">
        {items.length === 0 ? (
          <T v="sub" style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            Nothing planned. Tap To-do above to add something.
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
        <Row icon={Wallet} iconColor="#E11D48" title="Spent today" rightText={rupees(spentToday)} onPress={() => navigation.navigate('Money')} chevron />
        <Row icon={Footprints} iconColor="#059669" title="Steps" subtitle={`Goal ${targetSteps.toLocaleString('en-IN')}`} rightText={steps.toLocaleString('en-IN')} onPress={() => navigation.navigate('Health')} chevron />
        <Row
          icon={Droplets}
          iconColor="#0284C7"
          title="Water"
          subtitle={`Goal ${(targetWaterMl / 1000).toFixed(1)} L`}
          rightText={`${(waterMl / 1000).toFixed(2).replace(/0$/, '')} L`}
          onPress={() => navigation.navigate('Health')}
          chevron
        />
        <Row
          icon={CloudSun}
          iconColor="#F59E0B"
          title={weather.isLive ? `${Math.round(weather.temperature)}° · ${weather.condition}` : "Today's weather"}
          subtitle={weather.isLive ? `${weather.city.split(',')[0]} · ${weather.umbrellaAdvice}` : 'Tap to see the weather where you are'}
          onPress={() => (weather.isLive ? navigation.navigate('Outfits') : detectWeather().catch(() => {}))}
          chevron
          last
        />
      </Section>

      <Section>
        <Row icon={Sparkles} iconColor="#7C3AED" title="What to wear today" subtitle="Outfit ideas from your own clothes" chevron onPress={() => navigation.navigate('Outfits')} last />
      </Section>
    </Screen>
  );
};

