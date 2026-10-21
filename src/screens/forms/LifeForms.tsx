import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { View } from 'react-native';
import { X, Plus } from 'lucide-react-native';
import { Form, Field, Pick, T, Button, DateField } from '../../ui/kit';
import { WhenPicker } from '../../components/WhenPicker';
import { useLifeStore, SpecialDay, billDueDate } from '../../modules/life/lifeStore';
import { confirmAction } from '../../core/confirm';
import { localDate } from '../../core/date';
import { TouchableOpacity } from '../../components/Touchable';
import { useColors } from '../../core/theme';

type Nav = { navigation: any; route: any };

export const MedicineForm: React.FC<Nav> = ({ navigation, route }) => {
  const c = useColors();
  const { medicines, saveMedicine, deleteMedicine } = useLifeStore(useShallow(({ medicines, saveMedicine, deleteMedicine }) => ({ medicines, saveMedicine, deleteMedicine })));
  const existing = medicines.find((m) => m.id === route.params?.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [dose, setDose] = useState(existing?.dose ?? '');
  const [times, setTimes] = useState<string[]>(existing?.times ?? ['8:00 AM']);
  const [note, setNote] = useState(existing?.note ?? '');
  const [stock, setStock] = useState(existing?.stock !== undefined ? String(existing.stock) : '');

  const save = () => {
    saveMedicine({ id: existing?.id, name: name.trim(), dose: dose.trim(), times: times.filter(Boolean), note: note.trim() || undefined, stock: stock ? Number(stock) : undefined });
    navigation.goBack();
  };

  return (
    <Form title={existing ? 'Edit medicine' : 'New medicine'} onCancel={() => navigation.goBack()} onSave={save} canSave={!!name.trim() && times.length > 0}>
      <Field label="Medicine name" value={name} onChangeText={setName} autoFocus={!existing} maxLength={40} />
      <Field label="How much (optional)" value={dose} onChangeText={setDose} maxLength={30} hint="For example: 1 tablet, 5 ml" />
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
      <Field label="Note (optional)" value={note} onChangeText={setNote} maxLength={60} hint="For example: after food" />
      <Field
        label="Tablets left (optional)"
        value={stock}
        onChangeText={(v) => setStock(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={4}
        hint="Goes down each time you tick a dose. We remind you to refill when 3 days are left."
      />
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
  const { bills, saveBill, deleteBill } = useLifeStore(useShallow(({ bills, saveBill, deleteBill }) => ({ bills, saveBill, deleteBill })));
  const existing = bills.find((b) => b.id === route.params?.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [amount, setAmount] = useState(existing?.amount ? String(existing.amount) : '');
  const [due, setDue] = useState(existing ? localDate(billDueDate(existing)) : '');
  const value = Math.max(0, Number(amount) || 0);
  const valid = !!name.trim() && value > 0 && !!due;

  const save = () => {
    saveBill({ id: existing?.id, name: name.trim(), amount: value, dueDay: Number(due.slice(8, 10)) });
    navigation.goBack();
  };

  return (
    <Form title={existing ? 'Edit bill' : 'New bill'} onCancel={() => navigation.goBack()} onSave={save} canSave={valid}>
      <Field label="Bill name" value={name} onChangeText={setName} autoFocus={!existing} maxLength={40} hint="For example: Electricity, Rent, Phone recharge" />
      <Field label="Amount" prefix="₹" keyboardType="decimal-pad" value={amount} onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))} maxLength={9} />
      <DateField label="Next due date" value={due} onChange={setDue} hint={due ? `We will remind you on day ${Number(due.slice(8, 10))} of every month.` : 'Pick the date of the next bill. It repeats every month.'} />
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
  const { specialDays, saveSpecialDay, deleteSpecialDay } = useLifeStore(useShallow(({ specialDays, saveSpecialDay, deleteSpecialDay }) => ({ specialDays, saveSpecialDay, deleteSpecialDay })));
  const existing = specialDays.find((d) => d.id === route.params?.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [kind, setKind] = useState<SpecialDay['kind']>(existing?.kind ?? 'Birthday');
  const [date, setDate] = useState(existing ? `${new Date().getFullYear()}-${existing.date}` : '');

  const save = () => {
    saveSpecialDay({ id: existing?.id, name: name.trim(), kind, date: date.slice(5) });
    navigation.goBack();
  };

  return (
    <Form title={existing ? 'Edit special day' : 'New special day'} onCancel={() => navigation.goBack()} onSave={save} canSave={!!name.trim() && !!date}>
      <Field label="Whose day is it?" value={name} onChangeText={setName} autoFocus={!existing} />
      <Pick label="What is it" options={['Birthday', 'Anniversary', 'Other']} value={kind} onChange={(v) => setKind(v as SpecialDay['kind'])} />
      <DateField label="Date" value={date} onChange={setDate} noYear hint="We will remind you every year at 9 AM." />
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
