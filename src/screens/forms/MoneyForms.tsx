import React, { useState } from 'react';
import { View, Text, TextInput, Share, Image, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Copy, Building2, CreditCard, Share2 } from 'lucide-react-native';
import { Form, Field, Pick, T, Button, Section, Row, Chips, AppBar, Screen } from '../../ui/kit';
import { TouchableOpacity } from '../../components/Touchable';
import { WhenPicker } from '../../components/WhenPicker';
import { useWalletStore, EXPENSE_CATEGORIES, INCOME_SOURCES } from '../../modules/wallet/walletStore';
import { useProfileStore } from '../../modules/profile/profileStore';
import { localDate } from '../../core/date';
import { confirmAction } from '../../core/confirm';
import { unlockWithDevice } from '../../core/security/deviceAuth';
import { useColors, useTextScale } from '../../core/theme';
import { rupees } from '../money/moneyMeta';

type Nav = { navigation: any; route: any };

const toNumber = (v: string) => Math.max(0, Number(v.replace(/[^0-9.]/g, '')) || 0);

export const TransactionForm: React.FC<Nav> = ({ navigation, route }) => {
  const c = useColors();
  const scale = useTextScale();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useWalletStore();
  const existing = transactions.find((t) => t.id === route.params?.id);
  const [kind, setKind] = useState<'Spent' | 'Received'>(existing ? (existing.type === 'INCOME' ? 'Received' : 'Spent') : route.params?.kind ?? 'Spent');
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '');
  const categories = kind === 'Spent' ? EXPENSE_CATEGORIES : INCOME_SOURCES;
  const [category, setCategory] = useState<string>(existing?.category ?? categories[0]);
  const [date, setDate] = useState(existing?.date ?? localDate());
  const [note, setNote] = useState(existing?.note ?? '');
  const value = toNumber(amount);

  const switchKind = (k: string) => {
    setKind(k as 'Spent' | 'Received');
    setCategory((k === 'Spent' ? EXPENSE_CATEGORIES : INCOME_SOURCES)[0]);
  };

  const save = () => {
    const data = {
      type: kind === 'Spent' ? ('EXPENSE' as const) : ('INCOME' as const),
      amount: value,
      category,
      date,
      note: note.trim() || undefined,
    };
    if (existing) updateTransaction(existing.id, data);
    else addTransaction({ ...data, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) });
    navigation.goBack();
  };

  return (
    <Form title={existing ? 'Edit entry' : kind === 'Spent' ? 'I spent' : 'I got money'} onCancel={() => navigation.goBack()} onSave={save} canSave={value > 0}>
      <Chips options={['Spent', 'Received']} value={kind} onChange={switchKind} style={{ marginBottom: 18 }} />
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <T v="section">Amount</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 40 * scale, fontWeight: '800', color: c.textMuted }}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            autoFocus={!existing}
            accessibilityLabel="Amount"
            placeholder="0"
            placeholderTextColor={c.textFaint}
            style={[{ fontSize: 40 * scale, fontWeight: '800', minWidth: 120, textAlign: 'center', color: c.ink }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as object)]}
          />
        </View>
      </View>
      <Pick label={kind === 'Spent' ? 'Spent on' : 'Money from'} options={categories} value={category} onChange={setCategory} />
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <T v="section" style={{ marginBottom: 8 }}>
          Date
        </T>
        <WhenPicker date={date} onChangeDate={setDate} time="" onChangeTime={() => {}} hideTime past />
      </View>
      <Field label="Note (optional)" value={note} onChangeText={setNote} hint={kind === 'Spent' ? 'For example: lunch with Riya' : 'For example: October salary'} />
      {existing ? (
        <Button
          title="Delete entry"
          variant="secondary"
          style={{ marginHorizontal: 16 }}
          onPress={() => confirmAction('Delete this entry?', `${rupees(existing.amount)} · ${existing.category}`, 'Delete', () => {
            deleteTransaction(existing.id);
            navigation.goBack();
          })}
        />
      ) : null}
    </Form>
  );
};

export const BudgetForm: React.FC<Nav> = ({ navigation }) => {
  const { monthlyBudget, categoryBudgets, setBudgets } = useWalletStore();
  const [total, setTotal] = useState(monthlyBudget ? String(monthlyBudget) : '');
  const [byCat, setByCat] = useState<Record<string, string>>(
    Object.fromEntries(EXPENSE_CATEGORIES.map((cat) => [cat, categoryBudgets[cat] ? String(categoryBudgets[cat]) : '']))
  );

  const save = () => {
    setBudgets(
      Math.round(toNumber(total)),
      Object.fromEntries(Object.entries(byCat).map(([k, v]) => [k, Math.round(toNumber(v))]).filter(([, v]) => (v as number) > 0))
    );
    navigation.goBack();
  };

  return (
    <Form title="Monthly budget" onCancel={() => navigation.goBack()} onSave={save}>
      <Field label="Total I want to spend this month" prefix="₹" keyboardType="numeric" value={total} onChangeText={setTotal} />
      <T v="section" style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        Limits by category (optional)
      </T>
      {EXPENSE_CATEGORIES.map((cat) => (
        <Field key={cat} label={cat} prefix="₹" keyboardType="numeric" value={byCat[cat]} onChangeText={(v) => setByCat({ ...byCat, [cat]: v })} />
      ))}
    </Form>
  );
};

export const UpiScreen: React.FC<Nav> = ({ navigation }) => {
  const c = useColors();
  const { upiId, upiName, setUpiDetails, customQrImageUri } = useWalletStore();
  const userName = useProfileStore((s) => s.profile.name);
  const [id, setId] = useState(upiId);
  const [name, setName] = useState(upiName || userName);
  const [error, setError] = useState('');
  const link = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName || userName)}&cu=INR`;

  const save = () => {
    if (!/^[\w.-]+@[A-Za-z]+$/.test(id.trim())) return setError('A UPI ID looks like name@bank, for example 98xxxxxx10@ybl');
    setError('');
    setUpiDetails(id.trim(), name.trim() || userName);
  };

  return (
    <Screen>
      <AppBar title="My UPI QR" onBack={() => navigation.goBack()} />
      {upiId || customQrImageUri ? (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderRadius: 20 }}>
            {customQrImageUri ? <Image source={{ uri: customQrImageUri }} style={{ width: 220, height: 220 }} /> : <QRCode value={link} size={220} />}
          </View>
          <T v="h2" style={{ marginTop: 14 }}>
            {upiName || userName}
          </T>
          <T v="sub">{upiId}</T>
          <T v="caption" center style={{ marginTop: 8, paddingHorizontal: 32 }}>
            Anyone can scan this with GPay, PhonePe or Paytm to pay you.
          </T>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, paddingHorizontal: 16 }}>
            <Button title="Copy UPI ID" icon={Copy} variant="secondary" style={{ flex: 1 }} onPress={() => Clipboard.setStringAsync(upiId)} />
            <Button title="Share" icon={Share2} variant="secondary" style={{ flex: 1 }} onPress={() => Share.share({ message: `Pay me on UPI: ${upiId}` })} />
          </View>
        </View>
      ) : (
        <T v="sub" style={{ padding: 16 }}>
          Add your UPI ID below to make a QR code people can scan to pay you.
        </T>
      )}
      <Section title={upiId ? 'Change details' : 'Your UPI details'}>
        <Field label="UPI ID" value={id} onChangeText={setId} autoCapitalize="none" keyboardType="email-address" error={error} />
        <Field label="Name shown to payers" value={name} onChangeText={setName} />
        <Button title="Save" onPress={save} style={{ marginHorizontal: 16 }} />
      </Section>
    </Screen>
  );
};

export const AccountsScreen: React.FC<Nav> = ({ navigation }) => {
  const c = useColors();
  const { bankAccounts, savedCards, deleteBankAccount, deleteCard } = useWalletStore();
  const [shown, setShown] = useState<string | null>(null);

  const reveal = async (id: string) => {
    if (shown === id) return setShown(null);
    if (await unlockWithDevice('Show number')) setShown(id);
  };
  const copy = async (text: string) => {
    if (await unlockWithDevice('Copy number')) Clipboard.setStringAsync(text);
  };

  return (
    <Screen>
      <AppBar title="Banks and cards" onBack={() => navigation.goBack()} />
      <Section title="Bank accounts" action={{ label: 'Add', onPress: () => navigation.navigate('AccountForm', { kind: 'bank' }) }}>
        {bankAccounts.length === 0 ? (
          <T v="sub" style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            No bank accounts saved.
          </T>
        ) : (
          bankAccounts.map((b, i) => (
            <Row
              key={b.id}
              icon={Building2}
              iconColor="#0891B2"
              title={b.bankName}
              subtitle={`${shown === b.id ? b.accountNumber : '•••• ' + b.accountNumber.slice(-4)} · IFSC ${b.ifscCode}`}
              onPress={() => reveal(b.id)}
              onLongPress={() => confirmAction('Remove this account?', b.bankName, 'Remove', () => deleteBankAccount(b.id))}
              last={i === bankAccounts.length - 1}
              right={
                <TouchableIcon icon={Copy} label="Copy account number" onPress={() => copy(b.accountNumber)} color={c.textMuted} />
              }
            />
          ))
        )}
      </Section>
      <Section title="Cards" action={{ label: 'Add', onPress: () => navigation.navigate('AccountForm', { kind: 'card' }) }}>
        {savedCards.length === 0 ? (
          <T v="sub" style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            No cards saved.
          </T>
        ) : (
          savedCards.map((card, i) => (
            <Row
              key={card.id}
              icon={CreditCard}
              iconColor="#7C3AED"
              title={card.cardName}
              subtitle={`${shown === card.id ? card.cardNumber : '•••• ' + card.cardNumber.replace(/\D/g, '').slice(-4)} · ${card.cardType} · expires ${card.expiryDate}`}
              onPress={() => reveal(card.id)}
              onLongPress={() => confirmAction('Remove this card?', card.cardName, 'Remove', () => deleteCard(card.id))}
              last={i === savedCards.length - 1}
              right={<TouchableIcon icon={Copy} label="Copy card number" onPress={() => copy(card.cardNumber.replace(/\s/g, ''))} color={c.textMuted} />}
            />
          ))
        )}
      </Section>
      <T v="caption" style={{ padding: 16 }}>
        Tap to show the full number. Long-press to remove. Your phone lock is asked first.
      </T>
    </Screen>
  );
};

const TouchableIcon: React.FC<{ icon: typeof Copy; label: string; onPress: () => void; color: string }> = ({ icon: I, label, onPress, color }) => (
  <TouchableOpacity onPress={onPress} accessibilityLabel={label} style={{ padding: 10 }}>
    <I size={20} color={color} />
  </TouchableOpacity>
);

export const AccountForm: React.FC<Nav> = ({ navigation, route }) => {
  const kind: 'bank' | 'card' = route.params?.kind ?? 'bank';
  const { addBankAccount, addCard } = useWalletStore();
  const userName = useProfileStore((s) => s.profile.name);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [d, setD] = useState('');
  const [holder, setHolder] = useState(userName);
  const [type, setType] = useState(kind === 'bank' ? 'Savings' : 'Debit');
  const [error, setError] = useState('');

  const save = () => {
    if (kind === 'bank') {
      if (b.replace(/\D/g, '').length < 9) return setError('Account number should be 9 to 18 digits');
      if (d.trim().length !== 11) return setError('IFSC code has 11 characters, for example SBIN0001234');
      addBankAccount({ bankName: a.trim(), accountNumber: b.replace(/\D/g, ''), ifscCode: d.trim().toUpperCase(), accountHolder: holder.trim(), accountType: type as 'Savings' | 'Current' });
    } else {
      const digits = b.replace(/\D/g, '');
      if (digits.length < 15) return setError('Card number should be 15 or 16 digits');
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(d.trim())) return setError('Expiry looks like MM/YY, for example 08/29');
      addCard({
        cardName: a.trim(),
        cardType: type as 'Credit' | 'Debit',
        network: digits.startsWith('4') ? 'Visa' : /^(5[1-5]|2[2-7])/.test(digits) ? 'Mastercard' : /^3[47]/.test(digits) ? 'Amex' : 'RuPay',
        cardNumber: digits.match(/.{1,4}/g)!.join(' '),
        expiryDate: d.trim(),
        cardHolder: holder.trim().toUpperCase(),
        colorTheme: 'dark',
      });
    }
    navigation.goBack();
  };

  return (
    <Form title={kind === 'bank' ? 'Add bank account' : 'Add card'} onCancel={() => navigation.goBack()} onSave={save} canSave={!!a.trim() && !!b.trim()}>
      <Field label={kind === 'bank' ? 'Bank name' : 'Card name or bank'} value={a} onChangeText={setA} autoFocus />
      <Field label={kind === 'bank' ? 'Account number' : 'Card number'} value={b} onChangeText={setB} keyboardType="number-pad" />
      <Field label={kind === 'bank' ? 'IFSC code' : 'Expiry (MM/YY)'} value={d} onChangeText={setD} autoCapitalize="characters" error={error} />
      <Field label="Name on account" value={holder} onChangeText={setHolder} />
      <Pick label="Type" options={kind === 'bank' ? ['Savings', 'Current'] : ['Debit', 'Credit']} value={type} onChange={setType} />
      <T v="caption" style={{ paddingHorizontal: 16 }}>
        We never ask for or store your card CVV or PIN.
      </T>
    </Form>
  );
};

