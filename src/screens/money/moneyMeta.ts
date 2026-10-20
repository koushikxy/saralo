import {
  Utensils,
  ShoppingBag,
  Tag,
  Home,
  Zap,
  Car,
  HeartPulse,
  Gamepad2,
  GraduationCap,
  Briefcase,
  Laptop,
  TrendingUp,
  Coins,
  Gift,
  RotateCcw,
  CircleDollarSign,
} from 'lucide-react-native';
import type { Icon } from '../../ui/kit';

const META: Record<string, [Icon, string]> = {
  'Food & Dining': [Utensils, '#EA580C'],
  Groceries: [ShoppingBag, '#D97706'],
  Shopping: [Tag, '#DB2777'],
  'Rent & Housing': [Home, '#E11D48'],
  'Bills & Utilities': [Zap, '#CA8A04'],
  'Transport & Fuel': [Car, '#2563EB'],
  'Health & Fitness': [HeartPulse, '#DC2626'],
  Entertainment: [Gamepad2, '#9333EA'],
  Education: [GraduationCap, '#0284C7'],
  Salary: [Briefcase, '#059669'],
  'Freelance / Projects': [Laptop, '#0891B2'],
  'Business / Sales': [TrendingUp, '#4F46E5'],
  Investments: [TrendingUp, '#4F46E5'],
  'Allowance / Pocket Money': [Coins, '#16A34A'],
  Gift: [Gift, '#C026D3'],
  'Refund / Cashback': [RotateCcw, '#0D9488'],
};

export const categoryMeta = (category: string): [Icon, string] => META[category] ?? [CircleDollarSign, '#64748B'];

export const rupees = (n: number) => `${n < 0 ? '−' : ''}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;
