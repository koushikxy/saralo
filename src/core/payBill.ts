import { useLifeStore } from '../modules/life/lifeStore';
import { useWalletStore } from '../modules/wallet/walletStore';
import { localDate } from './date';

export const toggleBillPaid = (id: string, month: string) => {
  const bill = useLifeStore.getState().bills.find((b) => b.id === id);
  if (!bill) return;
  const paying = !bill.paidMonths.includes(month);
  useLifeStore.getState().togglePaid(id, month);
  if (!bill.amount) return;
  const note = `${bill.name} bill`;
  const wallet = useWalletStore.getState();
  if (paying) {
    const today = localDate();
    wallet.addTransaction({ type: 'EXPENSE', amount: bill.amount, category: 'Bills & Utilities', note, date: today.startsWith(month) ? today : `${month}-01` });
  } else {
    const tx = wallet.transactions.find((t) => t.type === 'EXPENSE' && t.note === note && t.date.startsWith(month));
    if (tx) wallet.deleteTransaction(tx.id);
  }
};
