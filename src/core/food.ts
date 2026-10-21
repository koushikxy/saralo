import { FOODS } from '../data/foods';

export type Food = { name: string; serving: string; kcal: number; protein: number; carbs: number; fat: number; fibre: number };

const POPULAR = new Set([
  'Chapati/Roti',
  'Boiled rice (Uble chawal)',
  'Boiled egg',
  'Omelette (1 egg)',
  'Mixed dal',
  'Washed moong dal (Dhuli moong ki dal)',
  'Plain parantha/paratha',
  'Potato parantha/paratha (Aloo ka parantha/paratha)',
  'Idli',
  'Plain dosa',
  'Masala dosa',
  'Poha',
  'Semolina upma (Suji/Rava upma)',
  'Sambar',
  'Plain khitchdi (Plain khichri/khichdi)',
  'Plain pulao',
  'Hot tea (Garam Chai)',
  'Curd (plain yogurt)',
  'Milk (toned / 2%)',
  'Potato curry (Aloo ki sabzi)',
  'Egg curry (Anda curry)',
  'Chicken curry',
  'Kidney bean curry (Rajmah curry)',
  'Kabuli channa curry',
  'Dhokla',
]);

const ALL: Food[] = FOODS.map(([name, serving, kcal, protein, carbs, fat, fibre]) => ({ name, serving: serving.replace(/^1 /, ''), kcal, protein, carbs, fat, fibre }));

export const findFood = (name: string) => ALL.find((f) => f.name === name);

export const searchFoods = (query: string, limit = 8) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const score = (f: Food) => {
    const n = f.name.toLowerCase();
    if (!words.every((w) => n.includes(w))) return -1;
    const starts = n.startsWith(words[0]) ? 3 : new RegExp(`(^|[^a-z])${words[0]}`).test(n) ? 2 : 0;
    return (POPULAR.has(f.name) ? 5000 : 0) + starts * 1000 - n.length;
  };
  return ALL.map((f) => [f, score(f)] as const)
    .filter(([, s]) => s >= 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([f]) => f);
};

const PROTEIN_WORDS = /dal|paneer|egg|chicken|fish|curd|yogurt|sprout|chana|channa|rajma|rajmah|soya|milk|moong|tofu|besan|chickpea|kidney bean|peanut|almond|lentil|prawn|mutton|keema/i;
const SKIP_WORDS = /halwa|kheer|cake|sweet|ladoo|laddu|barfi|pie|souffle|milkshake|nog|ice cream|payasam|pudding|biscuit|cookie/i;

const MEAT = /chicken|fish|mutton|prawn|keema|meat|salami|lamb|kebab|boti|seekh/i;
const EGG = /egg|omelette|anda/i;

export const suggestFoods = (kcalLeft: number, proteinLeft: number, diet = '', limit = 3) => {
  if (kcalLeft < 80) return [];
  const allowed = (f: Food) => (diet === 'Non-veg' ? true : diet === 'Eggs too' ? !MEAT.test(f.name) : !MEAT.test(f.name) && !EGG.test(f.name));
  const pool = ALL.filter((f) => PROTEIN_WORDS.test(f.name) && !SKIP_WORDS.test(f.name) && allowed(f) && f.kcal >= 60 && f.kcal <= kcalLeft && f.protein >= 3 && !/stock|soup/i.test(f.name));
  const score = (f: Food) => (proteinLeft > 5 ? (f.protein * 4) / f.kcal : 0) * 100 + (POPULAR.has(f.name) ? 15 : 0) - Math.abs(f.kcal - Math.min(kcalLeft, 450)) / 40;
  const picked: Food[] = [];
  for (const f of pool.sort((a, b) => score(b) - score(a))) {
    const key = (f.name.toLowerCase().match(PROTEIN_WORDS) ?? [''])[0];
    if (picked.some((p) => (p.name.toLowerCase().match(PROTEIN_WORDS) ?? [''])[0] === key)) continue;
    picked.push(f);
    if (picked.length === limit) break;
  }
  return picked;
};
