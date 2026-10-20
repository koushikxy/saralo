export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parseTime = (value?: string) => {
  const m = value?.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) || value?.trim().match(/^(\d{1,2})(?::(\d{2}))?()$/);
  if (!m) return null;
  let hours = Number(m[1]) % 12;
  if (!m[3] && Number(m[1]) >= 12) hours = Number(m[1]);
  if (m[3]?.toLowerCase() === 'pm') hours += 12;
  return hours * 60 + Number(m[2] || 0);
};

export const formatTime = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${suffix}`;
};

export const repeatText = (days: string[]) => {
  const set = new Set(days);
  if (set.size === 0 || set.size === 7) return 'Every day';
  if (set.size === 5 && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].every((d) => set.has(d))) return 'Weekdays';
  if (set.size === 2 && set.has('Sat') && set.has('Sun')) return 'Weekends';
  return days.join(', ');
};
