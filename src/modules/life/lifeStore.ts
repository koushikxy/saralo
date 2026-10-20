import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../../core/storage/persistStorage';
import { localDate } from '../../core/date';

export interface Medicine {
  id: string;
  name: string;
  dose: string;
  times: string[];
  note?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  paidMonths: string[];
}

export interface SpecialDay {
  id: string;
  name: string;
  date: string;
  kind: 'Birthday' | 'Anniversary' | 'Other';
}

export interface ShoppingItem {
  id: string;
  text: string;
  done: boolean;
}

interface LifeState {
  medicines: Medicine[];
  medTaken: Record<string, string[]>;
  bills: Bill[];
  specialDays: SpecialDay[];
  shopping: ShoppingItem[];
  saveMedicine: (m: Omit<Medicine, 'id'> & { id?: string }) => void;
  deleteMedicine: (id: string) => void;
  toggleTaken: (medId: string, time: string, day?: string) => void;
  saveBill: (b: Omit<Bill, 'id' | 'paidMonths'> & { id?: string }) => void;
  deleteBill: (id: string) => void;
  togglePaid: (id: string, month: string) => void;
  saveSpecialDay: (d: Omit<SpecialDay, 'id'> & { id?: string }) => void;
  deleteSpecialDay: (id: string) => void;
  addShopping: (text: string) => void;
  toggleShopping: (id: string) => void;
  clearBought: () => void;
  deleteShopping: (id: string) => void;
}

const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list];

export const useLifeStore = create<LifeState>()(
  persist(
    (set) => ({
      medicines: [],
      medTaken: {},
      bills: [],
      specialDays: [],
      shopping: [],
      saveMedicine: ({ id, ...m }) => set((s) => ({ medicines: upsert(s.medicines, { ...m, id: id ?? newId('med') }) })),
      deleteMedicine: (id) => set((s) => ({ medicines: s.medicines.filter((m) => m.id !== id) })),
      toggleTaken: (medId, time, day = localDate()) =>
        set((s) => {
          const key = `${medId}@${time}`;
          const list = s.medTaken[day] ?? [];
          return { medTaken: { ...s.medTaken, [day]: list.includes(key) ? list.filter((k) => k !== key) : [...list, key] } };
        }),
      saveBill: ({ id, ...b }) =>
        set((s) => {
          const existing = s.bills.find((x) => x.id === id);
          return { bills: upsert(s.bills, { ...b, id: id ?? newId('bill'), paidMonths: existing?.paidMonths ?? [] }) };
        }),
      deleteBill: (id) => set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),
      togglePaid: (id, month) =>
        set((s) => ({
          bills: s.bills.map((b) =>
            b.id !== id ? b : { ...b, paidMonths: b.paidMonths.includes(month) ? b.paidMonths.filter((m) => m !== month) : [...b.paidMonths, month] }
          ),
        })),
      saveSpecialDay: ({ id, ...d }) => set((s) => ({ specialDays: upsert(s.specialDays, { ...d, id: id ?? newId('day') }) })),
      deleteSpecialDay: (id) => set((s) => ({ specialDays: s.specialDays.filter((d) => d.id !== id) })),
      addShopping: (text) =>
        set((s) => {
          const same = s.shopping.find((i) => i.text.trim().toLowerCase() === text.trim().toLowerCase());
          if (same) return { shopping: s.shopping.map((i) => (i.id === same.id ? { ...i, done: false } : i)) };
          return { shopping: [{ id: newId('shop'), text: text.trim(), done: false }, ...s.shopping] };
        }),
      toggleShopping: (id) => set((s) => ({ shopping: s.shopping.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),
      clearBought: () => set((s) => ({ shopping: s.shopping.filter((i) => !i.done) })),
      deleteShopping: (id) => set((s) => ({ shopping: s.shopping.filter((i) => i.id !== id) })),
    }),
    { name: 'saralo-life', storage: persistStorage }
  )
);

export const daysUntil = (monthDay: string, from = new Date()) => {
  const [m, d] = monthDay.split('-').map(Number);
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
};

export const billDueDate = (bill: Bill, from = new Date()) => {
  const last = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
  return new Date(from.getFullYear(), from.getMonth(), Math.min(bill.dueDay, last));
};
