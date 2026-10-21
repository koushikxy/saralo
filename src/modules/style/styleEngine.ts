import { WardrobeItem, OccasionType } from './styleStore';
import { localDate } from '../../core/date';

export interface CuratedOutfit {
  id: string;
  title: string;
  occasion: OccasionType;
  vibe: string;
  harmonyScore: number;
  paletteDescription: string;
  stylingRule: string;
  top?: WardrobeItem;
  bottom?: WardrobeItem;
  onePiece?: WardrobeItem;
  shoes: WardrobeItem;
  outerwear?: WardrobeItem;
  watch?: WardrobeItem;
  bracelet?: WardrobeItem;
  isAllClean: boolean;
  laundryWarning?: string;
}

export const COLOR_SWATCH: Record<string, string> = {
  Black: '#111111',
  White: '#F8F8F8',
  Grey: '#9CA3AF',
  Navy: '#1E3A8A',
  Blue: '#3B82F6',
  Denim: '#4F6D8F',
  Beige: '#D6C3A3',
  Cream: '#F3E9D2',
  Brown: '#7C4A2D',
  Olive: '#6B7A3A',
  Green: '#16A34A',
  Maroon: '#7F1D1D',
  Red: '#DC2626',
  Pink: '#F472B6',
  Orange: '#F97316',
  Mustard: '#D4A017',
  Yellow: '#FACC15',
  Purple: '#7C3AED',
  Other: '#A3A3A3',
};

export const COLORS = Object.keys(COLOR_SWATCH);

const NEUTRAL = new Set(['black', 'white', 'grey', 'gray', 'navy', 'beige', 'cream', 'brown', 'denim', 'off-white', 'charcoal', 'tan', 'khaki']);
const GOOD = [
  ['blue', 'orange'],
  ['blue', 'mustard'],
  ['blue', 'pink'],
  ['olive', 'maroon'],
  ['olive', 'mustard'],
  ['olive', 'cream'],
  ['maroon', 'mustard'],
  ['green', 'pink'],
  ['purple', 'mustard'],
  ['maroon', 'beige'],
];
const CLASH = [
  ['red', 'green'],
  ['red', 'pink'],
  ['red', 'orange'],
  ['orange', 'pink'],
  ['red', 'maroon'],
  ['yellow', 'mustard'],
  ['purple', 'orange'],
  ['green', 'orange'],
];
const CLASSIC = [
  ['navy', 'beige'],
  ['navy', 'white'],
  ['black', 'white'],
  ['denim', 'white'],
  ['brown', 'cream'],
  ['grey', 'black'],
];

const tone = (i: WardrobeItem) => i.color.trim().toLowerCase();
const isNeutral = (i: WardrobeItem) => NEUTRAL.has(tone(i)) || tone(i) === 'olive';
const pairIn = (list: string[][], a: string, b: string) => list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

const harmony = (parts: WardrobeItem[]) => {
  const loud = parts.filter((p) => !isNeutral(p));
  let score = 0;
  let rule = '';
  for (let i = 0; i < parts.length; i++)
    for (let j = i + 1; j < parts.length; j++) {
      const a = tone(parts[i]);
      const b = tone(parts[j]);
      if (pairIn(CLASH, a, b)) score -= 30;
      if (pairIn(GOOD, a, b)) {
        score += 14;
        rule = `${parts[i].color} and ${parts[j].color.toLowerCase()} is a well-loved colour pair.`;
      }
      if (pairIn(CLASSIC, a, b)) {
        score += 10;
        rule ||= `${parts[i].color} with ${parts[j].color.toLowerCase()} is a classic, always smart.`;
      }
    }
  if (loud.length === 0) {
    score += 12;
    rule ||= 'All neutral colours, so everything goes together.';
  } else if (loud.length === 1) {
    score += 18;
    rule ||= `Neutral base with one pop of ${loud[0].color.toLowerCase()}. Easy and balanced.`;
  } else if (!rule) {
    score -= 8;
    rule = 'Two bold colours. Works if you like a louder look.';
  }
  const top = parts[0];
  const bottom = parts[1];
  if (top && bottom && tone(top) === tone(bottom) && !isNeutral(top)) {
    score -= 30;
    rule = 'Same colour top and bottom. A neutral piece would balance it.';
  }
  if (top && bottom && tone(top) === 'denim' && tone(bottom) === 'denim') score -= 12;
  return { score, rule };
};

const daysSince = (day?: string) => (day ? Math.round((new Date(`${localDate()}T00:00:00`).getTime() - new Date(`${day}T00:00:00`).getTime()) / 86400000) : 99);

const warmthFits = (item: WardrobeItem, temp: number) => {
  const w = item.warmth ?? 'Medium';
  return temp >= 28 ? w !== 'Warm' : temp <= 18 ? w !== 'Light' : true;
};

const forOccasion = (items: WardrobeItem[], occasion: OccasionType) => {
  if (occasion === 'All') return items;
  const tagged = items.filter((i) => i.tags.includes(occasion));
  return tagged.length > 0 ? tagged : items;
};

export function generateCuratedOutfits(
  wardrobe: WardrobeItem[],
  occasion: OccasionType,
  temperature: number = 24,
  opts: { pinId?: string; rainy?: boolean; round?: number } = {}
): CuratedOutfit[] {
  const pinned = wardrobe.find((w) => w.id === opts.pinId);
  const pool = (category: WardrobeItem['category']) => {
    if (pinned?.category === category) return [pinned];
    if (pinned && (category === 'Tops' || category === 'Bottoms') && pinned.category === 'One-piece') return [];
    if (pinned && category === 'One-piece' && (pinned.category === 'Tops' || pinned.category === 'Bottoms')) return [];
    return forOccasion(wardrobe.filter((i) => i.category === category), occasion).slice(0, 14);
  };
  const tops = pool('Tops');
  const bottoms = pool('Bottoms');
  const pieces = pool('One-piece');
  const shoes = pool('Shoes');
  if (shoes.length === 0 || ((tops.length === 0 || bottoms.length === 0) && pieces.length === 0)) return [];

  const outerwear = temperature < 20 ? pool('Outerwear').find((i) => i.isClean) : undefined;
  const accessories = wardrobe.filter((i) => i.category === 'Accessories' && i.isClean);
  const watch = accessories.find((i) => i.imageEmoji === '⌚' || /watch/i.test(i.name));
  const bracelet = accessories.find((i) => i.imageEmoji === '📿' || /bracelet|cuff|band|kada/i.test(i.name));

  const itemScore = (i: WardrobeItem) =>
    (occasion !== 'Everyday Casual' && i.tags.includes(occasion) ? 22 : 0) +
    (i.isClean ? 25 : -40) + (warmthFits(i, temperature) ? 8 : -12) - Math.min(i.timesWorn ?? i.wearCount, 15) * 0.6 - (daysSince(i.lastWorn) === 0 ? 0 : daysSince(i.lastWorn) <= 2 ? 18 : daysSince(i.lastWorn) <= 5 ? 6 : 0);

  const combos: { main: WardrobeItem[]; shoes: WardrobeItem; score: number; rule: string; match: number }[] = [];
  const consider = (main: WardrobeItem[], shoe: WardrobeItem) => {
    const parts = [...main, shoe];
    const h = harmony(parts);
    let score = h.score + (parts.reduce((s, p) => s + itemScore(p), 0) / parts.length) * 3;
    if (opts.rainy && /white|suede/i.test(`${shoe.color} ${shoe.fabric}`)) score -= 30;
    if (occasion === 'Festival & Wedding' && main.length === 1) score += 10;
    combos.push({ main, shoes: shoe, score, rule: h.rule, match: h.score });
  };
  for (const shoe of shoes.slice(0, 8)) {
    for (const top of tops) for (const bottom of bottoms) consider([top, bottom], shoe);
    for (const piece of pieces) consider([piece], shoe);
  }

  const sorted = combos.sort((a, b) => b.score - a.score);
  const ranked = sorted.some((c) => c.match >= 0) ? sorted.filter((c) => c.match >= 0) : sorted;
  const chosen: typeof combos = [];
  const used = new Set<string>();
  for (const combo of ranked) {
    const key = combo.main.map((m) => m.id);
    if (!pinned && key.some((k) => used.has(k))) continue;
    if (chosen.some((c) => c.main.map((m) => m.id).join() === key.join())) continue;
    chosen.push(combo);
    key.forEach((k) => used.add(k));
    if (chosen.length === 9) break;
  }
  if (chosen.length === 0) chosen.push(ranked[0]);
  const start = ((opts.round ?? 0) * 3) % chosen.length;
  const shown = [...chosen.slice(start), ...chosen.slice(0, start)].slice(0, 3);

  return shown.map(({ main, shoes: shoe, rule, match }, idx) => {
    const [first, second] = main;
    const items = [...main, shoe, outerwear, watch, bracelet].filter(Boolean) as WardrobeItem[];
    const dirty = items.filter((i) => !i.isClean);
    const notes = [rule];
    if (outerwear) notes.push(`It is ${Math.round(temperature)}°C, so take the ${outerwear.name.toLowerCase()}.`);
    else if (temperature >= 30) notes.push(`It is ${Math.round(temperature)}°C, keep it light.`);
    if (opts.rainy) notes.push('Rain is likely, carry an umbrella.');
    return {
      id: `outfit-${main.map((m) => m.id).join('-')}-${shoe.id}`,
      title: second ? `${first.name} with ${second.name.charAt(0).toLowerCase()}${second.name.slice(1)}` : first.name,
      occasion,
      vibe: idx === 0 && start === 0 ? 'Best pick for today' : 'Another idea',
      harmonyScore: Math.max(35, Math.min(98, Math.round(68 + match * 0.9))),
      paletteDescription: [...main, shoe].map((p) => p.color).join(' + '),
      stylingRule: notes.join(' '),
      top: second ? first : undefined,
      bottom: second,
      onePiece: second ? undefined : first,
      shoes: shoe,
      outerwear,
      watch,
      bracelet,
      isAllClean: dirty.length === 0,
      laundryWarning: dirty.length ? `${dirty.map((d) => d.name).join(', ')} ${dirty.length === 1 ? 'is' : 'are'} in the laundry.` : undefined,
    };
  });
}
