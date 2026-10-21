import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { View, TextInput, Switch, Share, Modal, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ListTodo, Bell, CalendarDays, ShoppingCart, Cake, ChevronLeft, ChevronRight, ChevronDown, X, Send, ArrowUp, Receipt } from 'lucide-react-native';
import { GROUP_ORDER, groupOf } from '../core/shopping';
import { Screen, AppBar, Chips, Section, Row, Fab, Empty, T, Icon, IconCircle } from '../ui/kit';
import { TouchableOpacity } from '../components/Touchable';
import { useColors, useTextScale } from '../core/theme';
import { localDate, parseTime, repeatText } from '../core/date';
import { readQuick } from '../core/quickAdd';
import { useFinanceOpsStore, DayOfWeek } from '../modules/finance/financeStore';
import { useLifeStore, daysUntil, billDueDate } from '../modules/life/lifeStore';
import { rupees } from './money/moneyMeta';

const WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const asDate = (d: string) => new Date(`${d}T00:00:00`);
const addDays = (d: string, n: number) => {
  const t = asDate(d);
  t.setDate(t.getDate() + n);
  return localDate(t);
};
const mondayOf = (d: string) => addDays(d, -((asDate(d).getDay() + 6) % 7));
const weekdayOf = (d: string) => WEEK[(asDate(d).getDay() + 6) % 7];
const dayName = (d: string, today: string) =>
  d === today ? 'Today' : d === addDays(today, 1) ? 'Tomorrow' : d === addDays(today, -1) ? 'Yesterday' : asDate(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

type Entry = { key: string; minutes: number | null; render: (last: boolean) => React.ReactElement };

const useDayEntries = (day: string, navigation: any) => {
  const c = useColors();
  const { todos, toggleTodo, calendarEvents, alarms } = useFinanceOpsStore(useShallow(({ todos, toggleTodo, calendarEvents, alarms }) => ({ todos, toggleTodo, calendarEvents, alarms })));
  const { bills, specialDays } = useLifeStore(useShallow(({ bills, specialDays }) => ({ bills, specialDays })));
  const entries: Entry[] = [
    ...calendarEvents
      .filter((e) => e.date === day)
      .map((e) => ({
        key: e.id,
        minutes: parseTime(e.startTime),
        render: (last: boolean) => (
          <Row key={e.id} icon={CalendarDays} iconColor="#0891B2" title={e.title} subtitle={[e.endTime ? `${e.startTime} – ${e.endTime}` : e.startTime, e.location].filter(Boolean).join(' · ')} onPress={() => navigation.navigate('EventForm', { id: e.id })} last={last} />
        ),
      })),
    ...todos
      .filter((t) => t.dueDate === day)
      .map((t) => ({
        key: t.id,
        minutes: t.isCompleted ? 2000 : parseTime(t.dueTime),
        render: (last: boolean) => (
          <Row key={t.id} title={t.title} subtitle={[t.dueTime || 'Any time', t.priority === 'High' ? 'Important' : null, t.category].filter(Boolean).join(' · ')} checked={t.isCompleted} onCheck={() => toggleTodo(t.id)} strike={t.isCompleted} onPress={() => navigation.navigate('TodoForm', { id: t.id })} last={last} />
        ),
      })),
    ...alarms
      .filter((a) => a.isEnabled && (a.days.length === 0 || a.days.includes(weekdayOf(day))))
      .map((a) => ({
        key: a.id,
        minutes: parseTime(a.time),
        render: (last: boolean) => <Row key={a.id} icon={Bell} iconColor="#D97706" title={a.label} subtitle={`${a.time} · ${repeatText(a.days)}`} onPress={() => navigation.navigate('ReminderForm', { id: a.id })} last={last} />,
      })),
    ...bills
      .filter((b) => localDate(billDueDate(b, asDate(day))) === day && !b.paidMonths.includes(day.slice(0, 7)))
      .map((b) => ({
        key: b.id,
        minutes: 9 * 60,
        render: (last: boolean) => <Row key={b.id} icon={Receipt} iconColor="#CA8A04" title={`${b.name} bill due`} subtitle={b.amount ? rupees(b.amount) : 'Monthly bill'} onPress={() => navigation.navigate('Bills')} last={last} />,
      })),
    ...specialDays
      .filter((d) => daysUntil(d.date, asDate(day)) === 0)
      .map((d) => ({
        key: d.id,
        minutes: -1,
        render: (last: boolean) => (
          <Row
            key={d.id}
            icon={Cake}
            iconColor="#C026D3"
            title={`${d.name}'s ${d.kind === 'Other' ? 'day' : d.kind.toLowerCase()}`}
            subtitle="All day"
            right={
              <TouchableOpacity onPress={() => Share.share({ message: wish(d.name, d.kind) })} accessibilityLabel={`Send wishes to ${d.name}`} style={{ padding: 8 }}>
                <Send size={20} color={c.accent} />
              </TouchableOpacity>
            }
            onPress={() => navigation.navigate('SpecialDayForm', { id: d.id })}
            last={last}
          />
        ),
      })),
  ];
  return entries.sort((a, b) => (a.minutes ?? 1500) - (b.minutes ?? 1500));
};

export const PlannerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const scale = useTextScale();
  const today = localDate();
  const [day, setDay] = useState(today);
  const [monthOpen, setMonthOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const { todos, calendarEvents, alarms, addTodo, toggleTodo } = useFinanceOpsStore(useShallow(({ todos, calendarEvents, alarms, addTodo, toggleTodo }) => ({ todos, calendarEvents, alarms, addTodo, toggleTodo })));
  const { shopping, specialDays } = useLifeStore(useShallow(({ shopping, specialDays }) => ({ shopping, specialDays })));
  const entries = useDayEntries(day, navigation);
  const quick = text.trim() ? readQuick(text) : null;
  const busy = new Set([...calendarEvents.map((e) => e.date), ...todos.filter((t) => !t.isCompleted).map((t) => t.dueDate)]);
  const overdue = day === today ? todos.filter((t) => !t.isCompleted && t.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)) : [];
  const nextWeek = day === today
    ? [
        ...todos.filter((t) => !t.isCompleted && t.dueDate > today && t.dueDate <= addDays(today, 7)).map((t) => ({ id: t.id, date: t.dueDate, time: t.dueTime, title: t.title, todo: true })),
        ...calendarEvents.filter((e) => e.date > today && e.date <= addDays(today, 7)).map((e) => ({ id: e.id, date: e.date, time: e.startTime, title: e.title, todo: false })),
      ].sort((a, b) => a.date.localeCompare(b.date) || (parseTime(a.time) ?? 1500) - (parseTime(b.time) ?? 1500))
    : [];
  const nextBirthday = [...specialDays].sort((a, b) => daysUntil(a.date) - daysUntil(b.date))[0];
  const birthdayIn = nextBirthday ? daysUntil(nextBirthday.date) : -1;

  const add = () => {
    if (!quick?.title) return;
    addTodo({ title: quick.title, dueDate: quick.date ?? day, dueTime: quick.time, category: 'Personal', priority: 'Medium' });
    setText('');
    if (quick.date && quick.date !== day) setDay(quick.date);
  };

  const monday = mondayOf(day);
  const shownMonth = asDate(day);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppBar title="Planner" />

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
          <TouchableOpacity onPress={() => setMonthOpen(!monthOpen)} accessibilityLabel={monthOpen ? 'Show week' : 'Show whole month'} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, flex: 1 }}>
            <T v="h2">{shownMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</T>
            <ChevronDown size={20} color={c.textMuted} style={{ transform: [{ rotate: monthOpen ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>
          {day !== today ? (
            <TouchableOpacity onPress={() => setDay(today)} style={{ paddingHorizontal: 14, height: 34, borderRadius: 17, backgroundColor: c.accentSoft, justifyContent: 'center', marginRight: 4 }}>
              <T v="sub" color={c.accent} style={{ fontWeight: '700' }}>
                Today
              </T>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => setDay(monthOpen ? localDate(new Date(shownMonth.getFullYear(), shownMonth.getMonth() - 1, 1)) : addDays(day, -7))} style={{ padding: 8 }} accessibilityLabel={monthOpen ? 'Previous month' : 'Previous week'}>
            <ChevronLeft size={24} color={c.ink} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDay(monthOpen ? localDate(new Date(shownMonth.getFullYear(), shownMonth.getMonth() + 1, 1)) : addDays(day, 7))} style={{ padding: 8 }} accessibilityLabel={monthOpen ? 'Next month' : 'Next week'}>
            <ChevronRight size={24} color={c.ink} />
          </TouchableOpacity>
        </View>

        {monthOpen ? (
          <MonthGrid day={day} today={today} busy={busy} onPick={(d) => { setDay(d); setMonthOpen(false); }} />
        ) : (
          <View style={{ flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginTop: 4 }}>
            {WEEK.map((w, i) => {
              const d = addDays(monday, i);
              const on = d === day;
              return (
                <TouchableOpacity key={d} onPress={() => setDay(d)} accessibilityLabel={dayName(d, today)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 18, backgroundColor: on ? c.accent : c.card, borderWidth: d === today && !on ? 1.5 : 0, borderColor: c.accent }}>
                  <T v="caption" color={on ? '#FFFFFF' : c.textMuted} style={{ fontWeight: '600' }}>
                    {w.slice(0, 1)}
                  </T>
                  <T v="strong" color={on ? '#FFFFFF' : c.ink} style={{ fontSize: 17 * scale, marginTop: 2 }}>
                    {Number(d.slice(8))}
                  </T>
                  <View style={{ width: 5, height: 5, borderRadius: 3, marginTop: 4, backgroundColor: busy.has(d) ? (on ? '#FFFFFF' : c.accent) : 'transparent' }} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ marginHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 18, paddingLeft: 16, paddingRight: 6, minHeight: 56 }}>
          <Plus size={20} color={c.textMuted} />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={add}
            submitBehavior="submit"
            returnKeyType="done"
            maxLength={80}
            accessibilityLabel="Add a to-do"
            placeholder={`Add a to-do for ${day === today ? 'today' : dayName(day, today).toLowerCase().startsWith('tomorrow') ? 'tomorrow' : asDate(day).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}`}
            placeholderTextColor={c.textFaint}
            style={[{ flex: 1, fontSize: 17 * scale, color: c.ink, paddingVertical: 12, paddingHorizontal: 10 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
          />
          {text.trim() ? (
            <TouchableOpacity onPress={add} accessibilityLabel="Save to-do" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUp size={22} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
        <T v="caption" style={{ paddingHorizontal: 28, marginTop: 6 }}>
          {quick && (quick.date || quick.time) ? `"${quick.title}" · ${[quick.date ? dayName(quick.date, today) : null, quick.time].filter(Boolean).join(', ')}` : 'Try: call mom at 6pm, pay rent tomorrow'}
        </T>

        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16 }}>
          <Tile icon={ShoppingCart} color="#059669" title="Shopping" sub={shopping.filter((i) => !i.done).length ? `${shopping.filter((i) => !i.done).length} to buy` : 'List is empty'} onPress={() => navigation.navigate('ShoppingList')} />
          <Tile icon={Bell} color="#D97706" title="Reminders" sub={!alarms.length ? 'None yet' : alarms.some((a) => a.isEnabled) ? `${alarms.filter((a) => a.isEnabled).length} on` : 'All turned off'} onPress={() => navigation.navigate('RemindersList')} />
          <Tile icon={Cake} color="#C026D3" title="Birthdays" sub={nextBirthday ? (birthdayIn === 0 ? `${nextBirthday.name} today` : birthdayIn === 1 ? 'Tomorrow' : `In ${birthdayIn} days`) : 'None yet'} onPress={() => navigation.navigate('SpecialDaysList')} />
        </View>

        {overdue.length ? (
          <Section title={`Overdue (${overdue.length})`}>
            {overdue.map((t, i) => (
              <Row key={t.id} title={t.title} subtitle={dayName(t.dueDate, today)} danger checked={false} onCheck={() => toggleTodo(t.id)} onPress={() => navigation.navigate('TodoForm', { id: t.id })} last={i === overdue.length - 1} />
            ))}
          </Section>
        ) : null}

        <Section title={dayName(day, today)} action={{ label: 'Add event', onPress: () => navigation.navigate('EventForm', { date: day }) }}>
          {entries.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 }}>
              <IconCircle icon={ListTodo} color={c.accent} size={52} />
              <T v="strong" style={{ marginTop: 10 }}>
                {day === today ? 'Your day is clear' : 'Nothing planned'}
              </T>
              <T v="sub" center style={{ marginTop: 4 }}>
                Type a to-do above or tap Add.
              </T>
            </View>
          ) : (
            entries.map((e, i) => e.render(i === entries.length - 1))
          )}
        </Section>

        {nextWeek.length ? (
          <Section title="Next 7 days">
            {nextWeek.slice(0, 8).map((x, i, list) => (
              <Row
                key={x.id}
                icon={x.todo ? ListTodo : CalendarDays}
                iconColor={x.todo ? c.accent : '#0891B2'}
                title={x.title}
                subtitle={[dayName(x.date, today), x.time].filter(Boolean).join(' · ')}
                onPress={() => setDay(x.date)}
                last={i === list.length - 1}
              />
            ))}
          </Section>
        ) : null}
      </Screen>
      <Fab label="Add" icon={Plus} onPress={() => setAdding(true)} />
      <AddSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onPick={(route) => {
          setAdding(false);
          navigation.navigate(route, route === 'TodoForm' || route === 'EventForm' ? { date: day } : undefined);
        }}
      />
    </View>
  );
};

const Tile: React.FC<{ icon: Icon; color: string; title: string; sub: string; onPress: () => void }> = ({ icon, color, title, sub, onPress }) => {
  const c = useColors();
  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={`${title}, ${sub}`} style={{ flex: 1, backgroundColor: c.card, borderRadius: 20, padding: 14 }}>
      <IconCircle icon={icon} color={color} size={40} />
      <T v="strong" style={{ marginTop: 10 }} lines={1}>
        {title}
      </T>
      <T v="caption" lines={1}>
        {sub}
      </T>
    </TouchableOpacity>
  );
};

const MonthGrid: React.FC<{ day: string; today: string; busy: Set<string>; onPick: (d: string) => void }> = ({ day, today, busy, onPick }) => {
  const c = useColors();
  const scale = useTextScale();
  const first = new Date(asDate(day).getFullYear(), asDate(day).getMonth(), 1);
  const blanks = (first.getDay() + 6) % 7;
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [...Array(blanks).fill(null), ...Array.from({ length: count }, (_, i) => localDate(new Date(first.getFullYear(), first.getMonth(), i + 1)))];
  return (
    <View style={{ marginHorizontal: 16, marginTop: 4, backgroundColor: c.card, borderRadius: 22, padding: 8 }}>
      <View style={{ flexDirection: 'row' }}>
        {WEEK.map((w) => (
          <T key={w} v="caption" center style={{ flex: 1, paddingVertical: 6 }}>
            {w.slice(0, 1)}
          </T>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) =>
          d ? (
            <TouchableOpacity key={d} onPress={() => onPick(d)} style={{ width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={d}>
              <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: d === day ? c.accent : 'transparent', borderWidth: d === today && d !== day ? 1.5 : 0, borderColor: c.accent }}>
                <T v="strong" color={d === day ? '#FFFFFF' : c.ink} style={{ fontSize: 16 * scale }}>
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
    </View>
  );
};

const ADD_OPTIONS: { route: string; title: string; sub: string; icon: Icon; color: string }[] = [
  { route: 'TodoForm', title: 'To-do', sub: 'Something you need to do', icon: ListTodo, color: '#0F766E' },
  { route: 'EventForm', title: 'Event', sub: 'A meeting, class or plan at a time', icon: CalendarDays, color: '#0891B2' },
  { route: 'ReminderForm', title: 'Reminder', sub: 'Repeats, like every morning or Sunday', icon: Bell, color: '#D97706' },
  { route: 'SpecialDayForm', title: 'Birthday or anniversary', sub: 'Reminds you every year', icon: Cake, color: '#C026D3' },
];

const AddSheet: React.FC<{ visible: boolean; onClose: () => void; onPick: (route: string) => void }> = ({ visible, onClose, onPick }) => {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={onClose} accessibilityLabel="Close" />
      <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingBottom: 16 + insets.bottom }}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, marginBottom: 12 }} />
        <T v="h2" style={{ paddingHorizontal: 24, marginBottom: 8 }}>
          Add to your planner
        </T>
        <View style={{ marginHorizontal: 16, borderRadius: 22, backgroundColor: c.card, overflow: 'hidden' }}>
          {ADD_OPTIONS.map((o, i) => (
            <Row key={o.route} icon={o.icon} iconColor={o.color} title={o.title} subtitle={o.sub} chevron onPress={() => onPick(o.route)} last={i === ADD_OPTIONS.length - 1} />
          ))}
        </View>
      </View>
    </Modal>
  );
};

export const RemindersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const { alarms, toggleAlarm } = useFinanceOpsStore(useShallow(({ alarms, toggleAlarm }) => ({ alarms, toggleAlarm })));
  const sorted = [...alarms].sort((a, b) => (parseTime(a.time) ?? 0) - (parseTime(b.time) ?? 0));
  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppBar title="Reminders" onBack={() => navigation.goBack()} />
        {alarms.length === 0 ? (
          <Empty icon={Bell} title="No reminders" text="For things that repeat, like drinking water at 11 AM or a call every Sunday." />
        ) : (
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
        )}
      </Screen>
      <Fab label="New reminder" icon={Plus} onPress={() => navigation.navigate('ReminderForm')} />
    </View>
  );
};

export const ShoppingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const scale = useTextScale();
  const { shopping, addShopping, toggleShopping, clearBought, deleteShopping, recentShopping } = useLifeStore(useShallow(({ shopping, addShopping, toggleShopping, clearBought, deleteShopping, recentShopping }) => ({ shopping, addShopping, toggleShopping, clearBought, deleteShopping, recentShopping })));
  const [text, setText] = useState('');
  const add = () => {
    if (!text.trim()) return;
    addShopping(text.trim());
    setText('');
  };
  const toBuy = shopping.filter((i) => !i.done);
  const bought = shopping.filter((i) => i.done);
  const again = recentShopping.filter((r) => !shopping.some((i) => i.text.toLowerCase() === r.toLowerCase())).slice(0, 10);
  const groups = GROUP_ORDER.map((g) => [g, toBuy.filter((i) => groupOf(i.text) === g)] as const).filter(([, list]) => list.length > 0);
  return (
    <Screen>
      <AppBar title="Shopping list" onBack={() => navigation.goBack()} right={toBuy.length ? [{ icon: Send, label: 'Share list', onPress: () => Share.share({ message: `Shopping list:\n${toBuy.map((i) => `• ${i.text}`).join('\n')}` }) }] : []} />
      <View style={{ marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 18, paddingLeft: 16, paddingRight: 6, minHeight: 56 }}>
        <Plus size={20} color={c.textMuted} />
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          submitBehavior="submit"
          returnKeyType="next"
          maxLength={60}
          accessibilityLabel="Item to buy"
          placeholder="Add an item, like 2 kg rice"
          placeholderTextColor={c.textFaint}
          style={[{ flex: 1, fontSize: 17 * scale, color: c.ink, paddingVertical: 12, paddingHorizontal: 10 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
        />
        {text.trim() ? (
          <TouchableOpacity onPress={add} accessibilityLabel="Add item" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUp size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </View>
      {again.length ? (
        <View style={{ marginTop: 14 }}>
          <T v="section" style={{ paddingHorizontal: 28, marginBottom: 8 }}>
            Buy again
          </T>
          <Chips options={again} value="" onChange={addShopping} />
        </View>
      ) : null}
      {shopping.length === 0 ? <Empty icon={ShoppingCart} title="Your list is empty" text="Type what you need above. Items are sorted into groups for you." /> : null}
      {groups.map(([group, list]) => (
        <Section key={group} title={`${group} (${list.length})`}>
          {list.map((i, idx) => (
            <Row
              key={i.id}
              title={i.text}
              checked={false}
              onCheck={() => toggleShopping(i.id)}
              right={
                <TouchableOpacity onPress={() => deleteShopping(i.id)} accessibilityLabel={`Remove ${i.text}`} style={{ padding: 8 }}>
                  <X size={18} color={c.textFaint} />
                </TouchableOpacity>
              }
              last={idx === list.length - 1}
            />
          ))}
        </Section>
      ))}
      {bought.length > 0 ? (
        <Section title="Bought" action={{ label: 'Clear', onPress: clearBought }}>
          {bought.map((i, idx) => (
            <Row key={i.id} title={i.text} checked onCheck={() => toggleShopping(i.id)} strike last={idx === bought.length - 1} />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
};

const wish = (name: string, kind: string) =>
  kind === 'Birthday' ? `Happy birthday, ${name}! 🎂 Wishing you a wonderful year ahead.` : kind === 'Anniversary' ? `Happy anniversary, ${name}! Wishing you many more happy years together.` : `Thinking of you today, ${name}!`;

export const SpecialDaysScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const { specialDays } = useLifeStore(useShallow(({ specialDays }) => ({ specialDays })));
  const sorted = [...specialDays].sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppBar title="Birthdays and anniversaries" onBack={() => navigation.goBack()} />
        {specialDays.length === 0 ? (
          <Empty icon={Cake} title="No birthdays yet" text="Add birthdays and anniversaries. We will remind you every year at 9 AM." />
        ) : (
          <Section>
            {sorted.map((d, i) => {
              const n = daysUntil(d.date);
              const [m, dd] = d.date.split('-').map(Number);
              return (
                <Row
                  key={d.id}
                  icon={Cake}
                  iconColor="#C026D3"
                  title={d.name}
                  subtitle={`${d.kind} · ${new Date(2000, m - 1, dd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`}
                  rightText={n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `${n} days`}
                  right={
                    n <= 1 ? (
                      <TouchableOpacity onPress={() => Share.share({ message: wish(d.name, d.kind) })} accessibilityLabel={`Send wishes to ${d.name}`} style={{ padding: 8 }}>
                        <Send size={20} color={c.accent} />
                      </TouchableOpacity>
                    ) : null
                  }
                  onPress={() => navigation.navigate('SpecialDayForm', { id: d.id })}
                  last={i === sorted.length - 1}
                />
              );
            })}
          </Section>
        )}
      </Screen>
      <Fab label="Add day" icon={Plus} onPress={() => navigation.navigate('SpecialDayForm')} />
    </View>
  );
};
