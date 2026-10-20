import React from 'react';
import { View } from 'react-native';
import { Plus, Receipt } from 'lucide-react-native';
import { Screen, AppBar, Section, Row, Fab, Empty } from '../../ui/kit';
import { localDate } from '../../core/date';
import { useLifeStore, billDueDate } from '../../modules/life/lifeStore';
import { rupees } from './moneyMeta';

export const BillsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { bills, togglePaid } = useLifeStore();
  const month = localDate().slice(0, 7);
  const sorted = [...bills].sort((a, b) => a.dueDay - b.dueDay);
  const total = bills.reduce((s, b) => s + b.amount, 0);
  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <AppBar title="Monthly bills" onBack={() => navigation.goBack()} />
        {bills.length === 0 ? (
          <Empty icon={Receipt} title="No bills yet" text="Add rent, electricity, phone or any bill you pay every month. We will remind you on the due day." action={{ label: 'Add a bill', onPress: () => navigation.navigate('BillForm') }} />
        ) : (
          <Section title={`${bills.filter((b) => b.paidMonths.includes(month)).length} of ${bills.length} paid this month · ${rupees(total)} total`}>
            {sorted.map((b, i) => {
              const paid = b.paidMonths.includes(month);
              return (
                <Row
                  key={b.id}
                  title={b.name}
                  subtitle={`${paid ? 'Paid' : 'Due ' + billDueDate(b).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${b.amount ? ' · ' + rupees(b.amount) : ''}`}
                  checked={paid}
                  onCheck={() => togglePaid(b.id, month)}
                  onPress={() => navigation.navigate('BillForm', { id: b.id })}
                  last={i === sorted.length - 1}
                />
              );
            })}
          </Section>
        )}
      </Screen>
      {bills.length > 0 ? <Fab label="New bill" icon={Plus} onPress={() => navigation.navigate('BillForm')} /> : null}
    </View>
  );
};
