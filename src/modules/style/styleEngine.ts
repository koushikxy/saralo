import { WardrobeItem, OccasionType } from './styleStore';

export interface CuratedOutfit {
  id: string;
  title: string;
  occasion: OccasionType;
  vibe: string;
  harmonyScore: number;
  paletteDescription: string;
  stylingRule: string;
  top: WardrobeItem;
  bottom: WardrobeItem;
  shoes: WardrobeItem;
  outerwear?: WardrobeItem;
  watch?: WardrobeItem;
  bracelet?: WardrobeItem;
  isAllClean: boolean;
  laundryWarning?: string;
}

const NEUTRALS = ['black', 'white', 'grey', 'gray', 'navy', 'beige', 'cream', 'tan', 'khaki', 'brown', 'denim', 'charcoal', 'olive', 'stone', 'neutral', 'off-white'];

const isNeutral = (item: WardrobeItem) => NEUTRALS.some((n) => item.color.toLowerCase().includes(n));

const fitsWeather = (item: WardrobeItem, temp: number) => temp >= item.idealWeatherMin - 2 && temp <= item.idealWeatherMax + 2;

const forOccasion = (items: WardrobeItem[], occasion: OccasionType) => {
  if (occasion === 'All') return items;
  const tagged = items.filter((i) => i.tags.includes(occasion));
  return tagged.length > 0 ? tagged : items;
};

const freshest = (items: WardrobeItem[]) => [...items].sort((a, b) => Number(b.isClean) - Number(a.isClean) || a.wearCount - b.wearCount);

const describe = (top: WardrobeItem, bottom: WardrobeItem, shoes: WardrobeItem) => {
  const loud = [top, bottom, shoes].filter((i) => !isNeutral(i));
  if (loud.length === 0) return 'All neutral colours, so everything goes together.';
  if (loud.length === 1) return `Neutral pieces let the ${loud[0].color.toLowerCase()} ${loud[0].name.toLowerCase()} stand out.`;
  return 'Two bold colours. Works if you like a louder look.';
};

const weatherNote = (temp: number, outerwear?: WardrobeItem) =>
  outerwear ? `It is ${Math.round(temp)}°C, so take the ${outerwear.name.toLowerCase()}.` : temp >= 28 ? `It is ${Math.round(temp)}°C, so keep it light.` : '';

export function generateCuratedOutfits(wardrobe: WardrobeItem[], occasion: OccasionType, temperature: number = 24): CuratedOutfit[] {
  const pick = (category: WardrobeItem['category']) => freshest(forOccasion(wardrobe.filter((i) => i.category === category), occasion));
  const tops = pick('Tops');
  const bottoms = pick('Bottoms');
  const shoes = pick('Shoes');
  if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) return [];

  const outerwear = temperature < 20 ? pick('Outerwear').find((i) => i.isClean) : undefined;
  const accessories = wardrobe.filter((i) => i.category === 'Accessories' && i.isClean);
  const watch = accessories.find((i) => i.imageEmoji === '⌚' || i.name.toLowerCase().includes('watch'));
  const bracelet = accessories.find((i) => i.imageEmoji === '📿' || /bracelet|cuff|band/i.test(i.name));

  const combos: { top: WardrobeItem; bottom: WardrobeItem; shoes: WardrobeItem; score: number }[] = [];
  for (const top of tops.slice(0, 12)) {
    for (const bottom of bottoms.slice(0, 12)) {
      for (const shoe of shoes.slice(0, 8)) {
        const parts = [top, bottom, shoe];
        const loud = parts.filter((i) => !isNeutral(i)).length;
        const score =
          parts.filter((i) => i.isClean).length * 20 +
          parts.filter((i) => fitsWeather(i, temperature)).length * 8 +
          (loud <= 1 ? 16 : 0) -
          parts.reduce((sum, i) => sum + Math.min(i.wearCount, 10), 0);
        combos.push({ top, bottom, shoes: shoe, score });
      }
    }
  }

  const chosen: typeof combos = [];
  for (const combo of combos.sort((a, b) => b.score - a.score)) {
    if (chosen.some((c) => c.top.id === combo.top.id || c.bottom.id === combo.bottom.id)) continue;
    chosen.push(combo);
    if (chosen.length === 3) break;
  }
  if (chosen.length === 0) chosen.push(combos[0]);

  return chosen.map(({ top, bottom, shoes: shoe }, idx) => {
    const items = [top, bottom, shoe, outerwear, watch, bracelet].filter(Boolean) as WardrobeItem[];
    const dirty = items.filter((i) => !i.isClean);
    const note = weatherNote(temperature, outerwear);
    return {
      id: `outfit-${top.id}-${bottom.id}-${shoe.id}`,
      title: `${top.name} with ${bottom.name}`,
      occasion,
      vibe: idx === 0 ? 'Best pick for today' : 'Another option',
      harmonyScore: Math.max(50, Math.min(99, 70 + (isNeutral(top) || isNeutral(bottom) ? 15 : 0) + (dirty.length === 0 ? 10 : 0))),
      paletteDescription: [top.color, bottom.color, shoe.color].join(' + '),
      stylingRule: [describe(top, bottom, shoe), note].filter(Boolean).join(' '),
      top,
      bottom,
      shoes: shoe,
      outerwear,
      watch,
      bracelet,
      isAllClean: dirty.length === 0,
      laundryWarning: dirty.length ? `${dirty.map((d) => d.name).join(', ')} ${dirty.length === 1 ? 'is' : 'are'} in the laundry.` : undefined,
    };
  });
}
