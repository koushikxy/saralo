import React, { useState } from 'react';
import { View } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { Form, Field, Pick, T, Button } from '../../ui/kit';
import { WhenPicker } from '../../components/WhenPicker';
import { useLifeStore, SpecialDay } from '../../modules/life/lifeStore';
import { confirmAction } from '../../core/confirm';
import { TouchableOpacity } from '../../components/Touchable';
import { useColors } from '../../core/theme';
import { localDate } from '../../core/date';

type Nav = { navigation: any; route: any };

export const MedicineForm: React.FC<Nav> = ({ navigation, route }) => {
  const c = useColors();
  const { medicines, saveMedicine, deleteMedicine } = useLifeStore();
  const existing = medicines.find((m) => m.id === route.params?.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [dose, setDose] = useState(existing?.dose ?? '');
  const [times, setTimes] = useState<string[]>(existing?.times ?? ['8:00 AM']);
  const [note, setNote] = useState(existing?.note ?? '');

  const save = () => {
    saveMedicine({ id: existing?.id, name: name.trim(), dose: dose.trim(), times: times.filter(Boolean), note: note.trim() || undefined });
    navigation.goBack();
  };

  return (
    <Form title={existing ? 'Edit medicine' : 'New medicine'} onCancel={() => navigation.goBack()} onSave={save} canSave={!!name.trim() && times.length > 0}>
      <Field label="Medicine name" value={name} onChangeText={setName} autoFocus={!existing} />
      <Field label="How much (optional)" value={dose} onChangeText={setDose} hint="For example: 1 tablet, 5 ml" />
      <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
        <T v="section" style={{ marginBottom: 8 }}>
          Times each day
        </T>
        {times.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <WhenPicker time={t} onChangeTime={(v) => setTimes(times.map((x, j) => (j === i ? v : x)))} allowNoTime={false} />
            </View>
            {times.length > 1 ? (
              <TouchableOpacity onPress={() => setTimes(times.filter((_, j) => j !== i))} accessibilityLabel="Remove time" style={{ padding: 8 }}>
                <X size={20} color={c.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
        {times.length < 6 ? (
          <TouchableOpacity onPress={() => setTimes([...times, '8:00 PM'])} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
            <Plus size={18} color={c.accent} />
            <T v="strong" color={c.accent}>
              Add another time
            </T>
          </TouchableOpacity>
        ) : null}
      </View>
      <Field label="Note (optional)" value={note} onChangeText={setNote} hint="For example: after food" />
      {existing ? (
        <Button
          title="Delete medicine"
          variant="secondary"
          style={{ marginHorizontal: 16 }}
          onPress={() => confirmAction('Delete this medicine?', existing.name, 'Delete', () => {
            deleteMedicine(existing.id);
            navigation.goBack();
          })}
        />
      ) : null}
    </Form>
  );
};

export const BillForm: React.FC<Nav> = ({ navigation, route }) => {
  const { bills, saveBill, deleteBill } = useLifeStore();
  const existing = bills.find((b) => b.id === route.params?.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(existing?.amount ? String(existing.amount) : '');
  const [day, setDay] = useState(existing ? String(existing.dueDay) : '');
  const dueDay = Math.min(31, Math.max(1, parseInt(day, 10) || 0));
  const valid = !!name.trim() && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31;

  const save = () => {
    saveBill({ id: existing?.id, name: name.trim(), amount: Math.max(0, Number(amount.replace(/[^0-9.]/g, '')) || 0), dueDay });
    navigation.goBack();
  };

  return (
    <Form title={existing ? 'Edit bill' : 'New bill'} onCancel={() => navigation.goBack()} onSave={save} canSave={valid}>
      <Field label="Bill name" value={name} onChangeText={setName} autoFocus={!existing} hint="For example: Electricity, Rent, Phone recharge" />
      <Field label="Amount (optional)" prefix="₹" keyboardType="numeric" value={amount} onChangeText={setAmount} />
      <Field label="Due every month on day" keyboardType="number-pad" value={day} onChangeText={setDay} maxLength={2} hint="A number from 1 to 31" />
      {existing ? (
        <Button
          title="Delete bill"
          variant="secondary"
          style={{ marginHorizontal: 16 }}
          onPress={() => confirmAction('Delete this bill?', existing.name, 'Delete', () => {
            deleteBill(existing.id);
            navigation.goBack();
          })}
        />
      ) : null}
    </Form>
  );
};

export const SpecialDayForm: React.FC<Nav> = ({ navigation, route }) => {
  const { specialDays, saveSpecialDay, deleteSpecialDay } = useLifeStore();
  const existing = specialDays.find((d) => d.id === route.params?.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState<SpecialDay['kind']>(existing?.kind ?? 'Birthday');
  const [date, setDate] = useState(existing ? `${new Date().getFullYear()}-${existing.date}` : localDate());

  const save = () => {
    saveSpecialDay({ id: existing?.id, name: name.trim(), kind, date: date.slice(5) });
    navigation.goBack();
  };

  return (
    <Form title={existing ? 'Edit special day' : 'New special day'} onCancel={() => navigation.goBack()} onSave={save} canSave={!!name.trim()}>
      <Field label="Whose day is it?" value={name} onChangeText={setName} autoFocus={!existing} />
      <Pick label="What is it" options={['Birthday', 'Anniversary', 'Other']} value={kind} onChange={(v) => setKind(v as SpecialDay['kind'])} />
      <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
        <T v="section" style={{ marginBottom: 8 }}>
          Date
        </T>
        <WhenPicker date={date} onChangeDate={setDate} time="" onChangeTime={() => {}} hideTime />
        <T v="caption">We will remind you every year at 9 AM.</T>
      </View>
      {existing ? (
        <Button
          title="Delete"
          variant="secondary"
          style={{ marginHorizontal: 16 }}
          onPress={() => confirmAction('Delete this day?', existing.name, 'Delete', () => {
            deleteSpecialDay(existing.id);
            navigation.goBack();
          })}
        />
      ) : null}
    </Form>
  );
};
