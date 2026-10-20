import React, { useState } from 'react';
import { View } from 'react-native';
import { QrCode, Landmark, ArrowUpRight, ArrowDownLeft, Wallet, Target, Receipt } from 'lucide-react-native';
import { Screen, AppBar, Chips, Section, Row, Empty, T, Button } from '../ui/kit';
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
  const { transactions, getTotalBalance, monthlyBudget, categoryBudgets } = useWalletStore();
  const { bills, togglePaid } = useLifeStore();
  const [filter, setFilter] = useState('All');
  const today = localDate();
  const month = today.slice(0, 7);
  const monthName = new Date().toLocaleDateString('en-IN', { month: 'long' });
  const monthTx = transactions.filter((t) => t.date.startsWith(month));
  const spent = monthTx.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
  const earned = monthTx.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const left = monthlyBudget - spent;

  const byCat = Object.entries(
    monthTx.filter((t) => t.type === 'EXPENSE').reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.category]: (acc[t.category] || 0) + t.amount }), {})
  ).sort((a, b) => b[1] - a[1]);

  const shown = transactions
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
          { icon: QrCode, label: 'My UPI QR', onPress: () => navigation.navigate('Upi') },
          { icon: Landmark, label: 'Banks and cards', onPress: () => navigation.navigate('Accounts') },
        ]}
      />

      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}>
        <T v="sub">Balance</T>
        <T v="big">{rupees(getTotalBalance())}</T>
        <T v="sub" style={{ marginTop: 4 }}>
          {monthName}: spent {rupees(spent)} · got {rupees(earned)}
        </T>
        {monthlyBudget > 0 ? (
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

      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 8 }}>
        <Button title="I spent" icon={ArrowUpRight} style={{ flex: 1, backgroundColor: '#E11D48' }} onPress={() => navigation.navigate('TransactionForm', { kind: 'Spent' })} />
        <Button title="I got money" icon={ArrowDownLeft} style={{ flex: 1, backgroundColor: '#047857' }} onPress={() => navigation.navigate('TransactionForm', { kind: 'Received' })} />
      </View>

      {bills.length > 0 ? (
        <Section title="Bills this month" action={{ label: 'See all', onPress: () => navigation.navigate('Bills') }}>
          {[...bills]
            .sort((a, b) => a.dueDay - b.dueDay)
            .slice(0, 4)
            .map((b, i, arr) => {
              const paid = b.paidMonths.includes(month);
              const due = billDueDate(b);
              return (
                <Row
                  key={b.id}
                  icon={Receipt}
                  iconColor="#CA8A04"
                  title={b.name}
                  subtitle={paid ? 'Paid' : `Due ${due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${b.amount ? ' · ' + rupees(b.amount) : ''}`}
                  checked={paid}
                  onCheck={() => togglePaid(b.id, month)}
                  onPress={() => navigation.navigate('BillForm', { id: b.id })}
                  last={i === arr.length - 1}
                />
              );
            })}
        </Section>
      ) : null}

      <Section title={`Spending in ${monthName}`} action={{ label: monthlyBudget || Object.keys(categoryBudgets).length ? 'Edit budget' : 'Set budget', onPress: () => navigation.navigate('BudgetForm') }}>
        {byCat.length === 0 ? (
          <T v="sub" style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            Nothing spent yet this month.
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

      <Section title="History">
        <Chips options={['All', 'Spent', 'Received']} value={filter} onChange={setFilter} style={{ paddingBottom: 8 }} />
        {groups.length === 0 ? (
          <Empty icon={Wallet} title="No entries yet" text="Tap I spent or I got money to write your first one." />
        ) : (
          groups.slice(0, 30).map(([date, list]) => (
            <View key={date}>
              <T v="caption" style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2, fontWeight: '600' }}>
                {dayLabel(date)}
              </T>
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
