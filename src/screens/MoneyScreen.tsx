import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { toggleBillPaid } from '../core/payBill';
import { View } from 'react-native';
import { QrCode, Landmark, ArrowUpRight, ArrowDownLeft, Wallet, Target, Receipt, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { TouchableOpacity } from '../components/Touchable';
import { Screen, AppBar, Segmented, Section, Row, Empty, T, Button } from '../ui/kit';
import { useColors } from '../core/theme';
import { localDate } from '../core/date';
import { useWalletStore, WalletTransaction } from '../modules/wallet/walletStore';
import { useLifeStore, billDueDate } from '../modules/life/lifeStore';
import { categoryMeta, rupees } from './money/moneyMeta';

const dayLabel = (d: string) => {
  const today = localDate();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (d === today) return 'Today';
  if (d === localDate(y)) return 'Yesterday';
  return new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

export const MoneyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const { transactions, getTotalBalance, monthlyBudget, categoryBudgets } = useWalletStore(useShallow(({ transactions, getTotalBalance, monthlyBudget, categoryBudgets }) => ({ transactions, getTotalBalance, monthlyBudget, categoryBudgets })));
  const bills = useLifeStore((s) => s.bills);
  const [filter, setFilter] = useState('All');
  const [offset, setOffset] = useState(0);
  const today = localDate();
  const thisMonth = today.slice(0, 7);
  const picked = new Date();
  picked.setDate(1);
  picked.setMonth(picked.getMonth() + offset);
  const month = localDate(picked).slice(0, 7);
  const monthName = picked.toLocaleDateString('en-IN', picked.getFullYear() === new Date().getFullYear() ? { month: 'long' } : { month: 'long', year: 'numeric' });
  const oldest = transactions.reduce((m, t) => (t.date < m ? t.date : m), today).slice(0, 7);
  const monthTx = transactions.filter((t) => t.date.startsWith(month));
  const spent = monthTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const earned = monthTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const hasIncome = transactions.some((t) => t.type === 'INCOME');
  const left = monthlyBudget - spent;

  const byCat = Object.entries(
    monthTx.filter((t) => t.type === 'EXPENSE').reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {})
  ).sort((a, b) => b[1] - a[1]);

  const shown = monthTx
    .filter((t) => (filter === 'Spent' ? t.type === 'EXPENSE' : filter === 'Received' ? t.type === 'INCOME' : true))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const groups = shown.reduce<[string, WalletTransaction[]][]>((acc, t) => {
    const last = acc[acc.length - 1];
    if (last && last[0] === t.date) last[1].push(t);
    else acc.push([t.date, [t]]);
    return acc;
  }, []);

  return (
    <Screen>
      <AppBar
        title="Money"
        right={[
          { icon: Receipt, label: 'Monthly bills', onPress: () => navigation.navigate('Bills') },
          { icon: QrCode, label: 'My UPI QR', onPress: () => navigation.navigate('Upi') },
          { icon: Landmark, label: 'Banks and cards', onPress: () => navigation.navigate('Accounts') },
        ]}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <TouchableOpacity onPress={() => setOffset(offset - 1)} disabled={month <= oldest} accessibilityLabel="Previous month" style={{ padding: 10, opacity: month <= oldest ? 0.3 : 1 }}>
          <ChevronLeft size={22} color={c.ink} />
        </TouchableOpacity>
        <T v="strong" center style={{ flex: 1 }}>
          {offset === 0 ? `This month · ${monthName}` : monthName}
        </T>
        <TouchableOpacity onPress={() => setOffset(offset + 1)} disabled={offset >= 0} accessibilityLabel="Next month" style={{ padding: 10, opacity: offset >= 0 ? 0.3 : 1 }}>
          <ChevronRight size={22} color={c.ink} />
        </TouchableOpacity>
      </View>
      <View style={{ marginHorizontal: 16, marginTop: 4, padding: 18, borderRadius: 22, backgroundColor: c.card }}>
        {hasIncome ? (
          <>
            <T v="sub">Balance</T>
            <T v="big">{rupees(getTotalBalance())}</T>
            <T v="sub" style={{ marginTop: 4 }}>
              {monthName}: spent {rupees(spent)} · got {rupees(earned)}
            </T>
          </>
        ) : (
          <>
            <T v="sub">Spent in {monthName}</T>
            <T v="big">{rupees(spent)}</T>
          </>
        )}
        {monthlyBudget > 0 && offset === 0 ? (
          <View style={{ marginTop: 12 }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: c.soft, overflow: 'hidden' }}>
              <View style={{ height: 8, width: `${Math.min(100, (spent / monthlyBudget) * 100)}%`, backgroundColor: left < 0 ? c.expense : c.income }} />
            </View>
            <T v="sub" color={left < 0 ? c.expense : c.income} style={{ marginTop: 6, fontWeight: '600' }}>
              {left >= 0 ? `${rupees(left)} left of your ${rupees(monthlyBudget)} budget` : `${rupees(-left)} over your budget`}
            </T>
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 14 }}>
        <Button title="I spent" icon={ArrowUpRight} style={{ flex: 1, backgroundColor: '#E11D48' }} onPress={() => navigation.navigate('TransactionForm', { kind: 'Spent' })} />
        <Button title="I got money" icon={ArrowDownLeft} style={{ flex: 1, backgroundColor: '#047857' }} onPress={() => navigation.navigate('TransactionForm', { kind: 'Received' })} />
      </View>

      {bills.length > 0 ? (
        <Section title="Bills this month" action={{ label: 'See all', onPress: () => navigation.navigate('Bills') }}>
          {[...bills]
            .sort((a, b) => a.dueDay - b.dueDay)
            .slice(0, 4)
            .map((b, i, arr) => {
              const paid = b.paidMonths.includes(thisMonth);
              const due = billDueDate(b);
              return (
                <Row
                  key={b.id}
                  icon={Receipt}
                  iconColor="#CA8A04"
                  title={b.name}
                  subtitle={paid ? 'Paid' : `Due ${due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${b.amount ? ' · ' + rupees(b.amount) : ''}`}
                  checked={paid}
                  onCheck={() => toggleBillPaid(b.id, thisMonth)}
                  onPress={() => navigation.navigate('BillForm', { id: b.id })}
                  last={i === arr.length - 1}
                />
              );
            })}
        </Section>
      ) : (
        <Section>
          <Row icon={Receipt} iconColor="#CA8A04" title="Monthly bills" subtitle="Rent, electricity, phone. Get a reminder on the due date." chevron onPress={() => navigation.navigate('Bills')} last />
        </Section>
      )}

      <Section title={`Spending in ${monthName}`} action={{ label: monthlyBudget || Object.keys(categoryBudgets).length ? 'Edit budget' : 'Set budget', onPress: () => navigation.navigate('BudgetForm') }}>
        {byCat.length === 0 ? (
          <T v="sub" style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            Nothing spent in {monthName}.
          </T>
        ) : (
          byCat.slice(0, 5).map(([cat, total], i, arr) => {
            const [I, color] = categoryMeta(cat);
            const limit = categoryBudgets[cat];
            return (
              <Row
                key={cat}
                icon={I}
                iconColor={color}
                title={cat}
                subtitle={limit ? `${Math.round((total / limit) * 100)}% of ${rupees(limit)}` : `${Math.round((total / spent) * 100)}% of spending`}
                rightText={rupees(total)}
                rightColor={limit && total > limit ? c.expense : undefined}
                onPress={() => setFilter('Spent')}
                last={i === arr.length - 1}
              />
            );
          })
        )}
      </Section>

      <Section title="History" plain>
        <Segmented options={['All', 'Spent', 'Received']} value={filter} onChange={setFilter} style={{ marginHorizontal: 16, marginBottom: 4 }} />
        {groups.length === 0 ? (
          <Empty icon={Wallet} title="No entries yet" text="Tap I spent or I got money to write your first one." />
        ) : (
          groups.map(([date, list]) => (
            <View key={date}>
              <T v="caption" style={{ paddingHorizontal: 28, paddingTop: 14, paddingBottom: 6, fontWeight: '600' }}>
                {dayLabel(date)}
              </T>
              <View style={{ marginHorizontal: 16, borderRadius: 22, backgroundColor: c.card, overflow: 'hidden' }}>
                {list.map((t, i) => {
                  const [I, color] = categoryMeta(t.category);
                  return (
                    <Row
                      key={t.id}
                      icon={I}
                      iconColor={color}
                      title={t.note || t.category}
                      subtitle={t.note ? t.category : t.time}
                      rightText={`${t.type === 'INCOME' ? '+' : '−'}${rupees(t.amount)}`}
                      rightColor={t.type === 'INCOME' ? c.income : c.ink}
                      onPress={() => navigation.navigate('TransactionForm', { id: t.id })}
                      last={i === list.length - 1}
                    />
                  );
                })}
              </View>
            </View>
          ))
        )}
      </Section>

      {monthlyBudget === 0 && transactions.length > 0 ? (
        <Section>
          <Row icon={Target} iconColor="#4F46E5" title="Set a monthly budget" subtitle="See how much you can still spend" chevron onPress={() => navigation.navigate('BudgetForm')} last />
        </Section>
      ) : null}
    </Screen>
  );
};
