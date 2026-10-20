import React, { useEffect, useState } from 'react';
import { View, TextInput, Switch } from 'react-native';
import { Plus, ListTodo, Bell, CalendarDays, ShoppingCart, Cake, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Screen, AppBar, Chips, Section, Row, Fab, Empty, T } from '../ui/kit';
import { TouchableOpacity } from '../components/Touchable';
import { useColors, useTextScale } from '../core/theme';
import { localDate, parseTime, repeatText } from '../core/date';
import { useFinanceOpsStore, TodoItem } from '../modules/finance/financeStore';
import { useLifeStore, daysUntil } from '../modules/life/lifeStore';

const TABS = ['To-dos', 'Reminders', 'Calendar', 'Shopping', 'Special days'] as const;
type Tab = (typeof TABS)[number];

const tomorrowOf = (d: string) => {
  const t = new Date(`${d}T00:00:00`);
  t.setDate(t.getDate() + 1);
  return localDate(t);
};

export const PlannerScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [tab, setTab] = useState<Tab>('To-dos');

  useEffect(() => {
    if (route.params?.tab) {
      setTab(route.params.tab);
      navigation.setParams({ tab: undefined });
    }
  }, [route.params?.tab]);

  const [calDay, setCalDay] = useState(localDate());
  const fab =
    tab === 'To-dos'
      ? { label: 'New to-do', go: () => navigation.navigate('TodoForm') }
      : tab === 'Reminders'
      ? { label: 'New reminder', go: () => navigation.navigate('ReminderForm') }
      : tab === 'Calendar'
      ? { label: 'New event', go: () => navigation.navigate('EventForm', { date: calDay }) }
      : tab === 'Special days'
      ? { label: 'Add day', go: () => navigation.navigate('SpecialDayForm') }
      : null;

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppBar title="Planner" />
        <Chips options={TABS} value={tab} onChange={(v) => setTab(v as Tab)} style={{ paddingBottom: 4 }} />
        {tab === 'To-dos' ? <Todos navigation={navigation} /> : null}
        {tab === 'Reminders' ? <Reminders navigation={navigation} /> : null}
        {tab === 'Calendar' ? <Calendar navigation={navigation} selected={calDay} setSelected={setCalDay} /> : null}
        {tab === 'Shopping' ? <Shopping /> : null}
        {tab === 'Special days' ? <SpecialDays navigation={navigation} /> : null}
      </Screen>
      {fab ? <Fab label={fab.label} icon={Plus} onPress={fab.go} /> : null}
    </View>
  );
};

const Todos: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { todos, toggleTodo } = useFinanceOpsStore();
  const today = localDate();
  const tomorrow = tomorrowOf(today);
  const byTime = (a: TodoItem, b: TodoItem) => a.dueDate.localeCompare(b.dueDate) || (parseTime(a.dueTime) ?? 1440) - (parseTime(b.dueTime) ?? 1440);
  const open = todos.filter((t) => !t.isCompleted).sort(byTime);
  const groups: [string, TodoItem[]][] = [
    ['Overdue', open.filter((t) => t.dueDate < today)],
    ['Today', open.filter((t) => t.dueDate === today)],
    ['Tomorrow', open.filter((t) => t.dueDate === tomorrow)],
    ['Later', open.filter((t) => t.dueDate > tomorrow)],
    ['Done', todos.filter((t) => t.isCompleted).slice(0, 20)],
  ];

  if (todos.length === 0) {
    return <Empty icon={ListTodo} title="No to-dos yet" text="Add things you need to do. Tick them off when done." action={{ label: 'Add a to-do', onPress: () => navigation.navigate('TodoForm') }} />;
  }

  return (
    <>
      {groups
        .filter(([, list]) => list.length > 0)
        .map(([title, list]) => (
          <Section key={title} title={title}>
            {list.map((t, i) => (
              <Row
                key={t.id}
                title={t.title}
                subtitle={[
                  title === 'Later' ? new Date(`${t.dueDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null,
                  t.dueTime,
                  t.category,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                checked={t.isCompleted}
                onCheck={() => toggleTodo(t.id)}
                strike={t.isCompleted}
                onPress={() => navigation.navigate('TodoForm', { id: t.id })}
                last={i === list.length - 1}
              />
            ))}
          </Section>
        ))}
    </>
  );
};

const Reminders: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const { alarms, toggleAlarm } = useFinanceOpsStore();
  if (alarms.length === 0) {
    return <Empty icon={Bell} title="No reminders" text="For things that repeat, like drinking water at 11 AM or a call every Sunday." action={{ label: 'Add a reminder', onPress: () => navigation.navigate('ReminderForm') }} />;
  }
  const sorted = [...alarms].sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0));
  return (
    <Section>
      {sorted.map((a, i) => (
        <Row
          key={a.id}
          icon={Bell}
          iconColor="#D97706"
          title={a.label}
          subtitle={`${a.time} · ${repeatText(a.days)}`}
          onPress={() => navigation.navigate('ReminderForm', { id: a.id })}
          last={i === sorted.length - 1}
          right={<Switch value={a.isEnabled} onValueChange={() => toggleAlarm(a.id)} trackColor={{ false: c.line, true: c.accent }} thumbColor="#FFFFFF" />}
        />
      ))}
    </Section>
  );
};

const Calendar: React.FC<{ navigation: any; selected: string; setSelected: (d: string) => void }> = ({ navigation, selected, setSelected }) => {
  const c = useColors();
  const scale = useTextScale();
  const { calendarEvents, todos } = useFinanceOpsStore();
  const today = localDate();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const blanks = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(blanks).fill(null), ...Array.from({ length: days }, (_, i) => localDate(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  const dayEvents = calendarEvents.filter((e) => e.date === selected).sort((a, b) => (parseTime(a.startTime) ?? 0) - (parseTime(b.startTime) ?? 0));
  const dayTodos = todos.filter((t) => t.dueDate === selected);
  const busy = new Set([...calendarEvents.map((e) => e.date), ...todos.filter((t) => !t.isCompleted).map((t) => t.dueDate)]);

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 12 }}>
        <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={{ padding: 10 }} accessibilityLabel="Previous month">
          <ChevronLeft size={24} color={c.ink} />
        </TouchableOpacity>
        <T v="strong">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</T>
        <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={{ padding: 10 }} accessibilityLabel="Next month">
          <ChevronRight size={24} color={c.ink} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <T key={i} v="caption" center style={{ flex: 1 }}>
            {d}
          </T>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 }}>
        {cells.map((d, i) =>
          d ? (
            <TouchableOpacity key={d} onPress={() => setSelected(d)} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={d}>
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: d === selected ? c.accent : 'transparent' }}>
                <T v="strong" color={d === selected ? '#FFFFFF' : d === today ? c.accent : c.ink} style={{ fontSize: 16 * scale }}>
                  {Number(d.slice(8))}
                </T>
              </View>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: busy.has(d) ? c.accent : 'transparent', marginTop: 1 }} />
            </TouchableOpacity>
          ) : (
            <View key={`b${i}`} style={{ width: `${100 / 7}%` }} />
          )
        )}
      </View>
      <Section title={selected === today ? 'Today' : new Date(`${selected}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} action={{ label: 'Add event', onPress: () => navigation.navigate('EventForm', { date: selected }) }}>
        {dayEvents.length === 0 && dayTodos.length === 0 ? (
          <T v="sub" style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            Nothing on this day.
          </T>
        ) : null}
        {dayEvents.map((e, i) => (
          <Row
            key={e.id}
            icon={CalendarDays}
            iconColor="#0891B2"
            title={e.title}
            subtitle={[e.endTime ? `${e.startTime} – ${e.endTime}` : e.startTime, e.location].filter(Boolean).join(' · ')}
            onPress={() => navigation.navigate('EventForm', { id: e.id })}
            last={i === dayEvents.length - 1 && dayTodos.length === 0}
          />
        ))}
        {dayTodos.map((t, i) => (
          <Row key={t.id} icon={ListTodo} title={t.title} subtitle={t.dueTime || 'To-do'} strike={t.isCompleted} onPress={() => navigation.navigate('TodoForm', { id: t.id })} last={i === dayTodos.length - 1} />
        ))}
      </Section>
    </>
  );
};

const Shopping: React.FC = () => {
  const c = useColors();
  const scale = useTextScale();
  const { shopping, addShopping, toggleShopping, clearBought, deleteShopping } = useLifeStore();
  const [text, setText] = useState('');
  const add = () => {
    if (!text.trim()) return;
    addShopping(text.trim());
    setText('');
  };
  const toBuy = shopping.filter((i) => !i.done);
  const bought = shopping.filter((i) => i.done);
  return (
    <>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 16 }}>
        <View style={{ flex: 1, borderWidth: 1.5, borderColor: c.line, borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center', minHeight: 52 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={add}
            submitBehavior="submit"
            returnKeyType="next"
            accessibilityLabel="Item to buy"
            placeholder="Add an item"
            placeholderTextColor={c.textFaint}
            style={{ fontSize: 17 * scale, color: c.ink, paddingVertical: 10 }}
          />
        </View>
        <TouchableOpacity onPress={add} accessibilityLabel="Add item" style={{ width: 52, borderRadius: 14, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {shopping.length === 0 ? <Empty icon={ShoppingCart} title="Your list is empty" text="Type what you need above. Tick items as you buy them." /> : null}
      {toBuy.length > 0 ? (
        <Section title={`To buy (${toBuy.length})`}>
          {toBuy.map((i, idx) => (
            <Row key={i.id} title={i.text} checked={false} onCheck={() => toggleShopping(i.id)} onLongPress={() => deleteShopping(i.id)} last={idx === toBuy.length - 1} />
          ))}
        </Section>
      ) : null}
      {bought.length > 0 ? (
        <Section title="Bought" action={{ label: 'Clear', onPress: clearBought }}>
          {bought.map((i, idx) => (
            <Row key={i.id} title={i.text} checked onCheck={() => toggleShopping(i.id)} strike last={idx === bought.length - 1} />
          ))}
        </Section>
      ) : null}
    </>
  );
};

const SpecialDays: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { specialDays } = useLifeStore();
  if (specialDays.length === 0) {
    return <Empty icon={Cake} title="No birthdays yet" text="Add birthdays and anniversaries. We will remind you on the day." action={{ label: 'Add a birthday', onPress: () => navigation.navigate('SpecialDayForm') }} />;
  }
  const sorted = [...specialDays].sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  return (
    <Section>
      {sorted.map((d, i) => {
        const n = daysUntil(d.date);
        const [m, day] = d.date.split('-').map(Number);
        return (
          <Row
            key={d.id}
            icon={Cake}
            iconColor="#C026D3"
            title={d.name}
            subtitle={`${d.kind} · ${new Date(2000, m - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`}
            rightText={n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `${n} days`}
            onPress={() => navigation.navigate('SpecialDayForm', { id: d.id })}
            last={i === sorted.length - 1}
          />
        );
      })}
    </Section>
  );
};
