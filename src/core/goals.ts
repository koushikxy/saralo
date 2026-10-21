export const CALORIES: Record<'Man' | 'Woman', Record<'Mostly sitting' | 'Some walking' | 'Very active', number>> = {
  Man: { 'Mostly sitting': 2110, 'Some walking': 2710, 'Very active': 3470 },
  Woman: { 'Mostly sitting': 1660, 'Some walking': 2130, 'Very active': 2720 },
};

export const goalsFor = (gender: string, activity: string, weightKg?: number) => {
  const g = gender === 'Man' || gender === 'Woman' ? gender : null;
  const a = (activity || 'Mostly sitting') as keyof (typeof CALORIES)['Man'];
  const water = weightKg ? Math.min(4000, Math.max(1750, Math.round((weightKg * 35) / 250) * 250)) : g === 'Man' ? 3000 : g === 'Woman' ? 2250 : 2500;
  const calories = g ? CALORIES[g][a] : Math.round((CALORIES.Man[a] + CALORIES.Woman[a]) / 2);
  return { targetWaterMl: water, targetCalories: calories };
};
