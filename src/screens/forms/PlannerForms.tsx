import React, { useState } from 'react';
import { View } from 'react-native';
import { Form, Field, Pick, T, Button } from '../../ui/kit';
import { WhenPicker } from '../../components/WhenPicker';
import { useFinanceOpsStore, TodoCategory, TodoPriority, DayOfWeek, EventType } from '../../modules/finance/financeStore';
import { localDate } from '../../core/date';
import { confirmAction } from '../../core/confirm';
import { TouchableOpacity } from '../../components/Touchable';
import { useColors } from '../../core/theme';

type Nav = { navigation: any; route: any };

const CATEGORIES: TodoCategory[] = ['Personal', 'Work', 'Home', 'Study', 'Health'];
const PRIORITIES: TodoPriority[] = ['High', 'Medium', 'Low'];
const WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EVENT_TYPES: EventType[] = ['Personal', 'Work', 'Meeting', 'Birthday', 'Class', 'Exam'];

export const TodoForm: React.FC<Nav> = ({ navigation, route }) => {
  const { todos, addTodo, updateTodo, deleteTodo } = useFinanceOpsStore();
  const existing = todos.find((t) => t.id === route.params?.id);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.dueDate ?? route.params?.date ?? localDate());
  const [time, setTime] = useState(existing?.dueTime ?? '');
  const [category, setCategory] = useState<TodoCategory>(existing?.category ?? 'Personal');
  const [priority, setPriority] = useState<TodoPriority>(existing?.priority ?? 'Medium');

  const save = () => {
    const data = { title: title.trim(), dueDate: date, dueTime: time || undefined, category, priority };
    if (existing) updateTodo(existing.id, data);
    else addTodo(data);
    navigation.goBack();
  };

  return (
    <Form title={existing ? 'Edit to-do' : 'New to-do'} onCancel={() => navigation.goBack()} onSave={save} canSave={!!title.trim()}>
      <Field label="What do you need to do?" value={title} onChangeText={setTitle} autoFocus={!existing} returnKeyType="done" />
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <T v="section" style={{ marginBottom: 8 }}>
          When
        </T>
        <WhenPicker date={date} onChangeDate={setDate} time={time} onChangeTime={setTime} />
      </View>
      <Pick label="Type" options={CATEGORIES} value={category} onChange={(v) => setCategory(v as TodoCategory)} />
      <Pick label="How important" options={PRIORITIES} value={priority} onChange={(v) => setPriority(v as TodoPriority)} />
      {existing ? (
        <Button
          title="Delete to-do"
          variant="secondary"
          style={{ marginHorizontal: 16, marginTop: 12 }}
          onPress={() => confirmAction('Delete this to-do?', existing.title, 'Delete', () => {
            deleteTodo(existing.id);
            navigation.goBack();
          })}
        />
      ) : null}
    </Form>
  );
};

export const ReminderForm: React.FC<Nav> = ({ navigation, route }) => {
  const c = useColors();
  const { alarms, addAlarm, updateAlarm, deleteAlarm } = useFinanceOpsStore();
  const existing = alarms.find((a) => a.id === route.params?.id);
  const [label, setLabel] = useState(existing?.label ?? '');
  const [time, setTime] = useState(existing?.time ?? '9:00 AM');
  const [days, setDays] = useState<DayOfWeek[]>(existing?.days ?? WEEK);

  const toggleDay = (d: DayOfWeek) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);
  const save = () => {
    const data = { label: label.trim(), time, days: days.length ? days : WEEK };
    if (existing) updateAlarm(existing.id, data);
    else addAlarm({ ...data, isEnabled: true, vibrate: true });
    navigation.goBack();
  };

  return (
    <Form title={existing ? 'Edit reminder' : 'New reminder'} onCancel={() => navigation.goBack()} onSave={save} canSave={!!label.trim()}>
      <Field label="Remind me to" value={label} onChangeText={setLabel} autoFocus={!existing} />
      <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
        <T v="section" style={{ marginBottom: 8 }}>
          Time
        </T>
        <WhenPicker time={time} onChangeTime={setTime} allowNoTime={false} />
      </View>
      <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
        <T v="section" style={{ marginBottom: 8 }}>
          Repeat on
        </T>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {WEEK.map((d) => {
            const on = days.includes(d);
            return (
              <TouchableOpacity
                key={d}
                onPress={() => toggleDay(d)}
                accessibilityLabel={d}
                style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.accent : c.soft }}
              >
                <T v="caption" color={on ? '#FFFFFF' : c.ink} style={{ fontWeight: '700' }}>
                  {d.slice(0, 2)}
                </T>
              </TouchableOpacity>
            );
          })}
        </View>
        <T v="caption" style={{ marginTop: 8 }}>
          {days.length === 7 || days.length === 0 ? 'Every day' : days.join(', ')}
        </T>
      </View>
      {existing ? (
        <Button
          title="Delete reminder"
          variant="secondary"
          style={{ marginHorizontal: 16 }}
          onPress={() => confirmAction('Delete this reminder?', existing.label, 'Delete', () => {
            deleteAlarm(existing.id);
            navigation.goBack();
          })}
        />
      ) : null}
    </Form>
  );
};

export const EventForm: React.FC<Nav> = ({ navigation, route }) => {
  const { calendarEvents, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useFinanceOpsStore();
  const existing = calendarEvents.find((e) => e.id === route.params?.id);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.date ?? route.params?.date ?? localDate());
  const [start, setStart] = useState(existing?.startTime ?? '10:00 AM');
  const [end, setEnd] = useState(existing?.endTime ?? '');
  const [place, setPlace] = useState(existing?.location ?? '');
  const [type, setType] = useState<EventType>(existing?.type ?? 'Personal');

  const save = () => {
    const data = { title: title.trim(), date, startTime: start, endTime: end || undefined, location: place.trim() || undefined, type };
    if (existing) updateCalendarEvent(existing.id, data);
    else addCalendarEvent(data);
    navigation.goBack();
  };

  return (
    <Form title={existing ? 'Edit event' : 'New event'} onCancel={() => navigation.goBack()} onSave={save} canSave={!!title.trim()}>
      <Field label="Event name" value={title} onChangeText={setTitle} autoFocus={!existing} />
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <T v="section" style={{ marginBottom: 8 }}>
          Date and start time
        </T>
        <WhenPicker date={date} onChangeDate={setDate} time={start} onChangeTime={setStart} allowNoTime={false} />
        <WhenPicker time={end} onChangeTime={setEnd} timeLabel="Add end time" />
      </View>
      <Field label="Place (optional)" value={place} onChangeText={setPlace} />
      <Pick label="Type" options={EVENT_TYPES} value={type} onChange={(v) => setType(v as EventType)} />
      {existing ? (
        <Button
          title="Delete event"
          variant="secondary"
          style={{ marginHorizontal: 16 }}
          onPress={() => confirmAction('Delete this event?', existing.title, 'Delete', () => {
            deleteCalendarEvent(existing.id);
            navigation.goBack();
          })}
        />
      ) : null}
    </Form>
  );
};
