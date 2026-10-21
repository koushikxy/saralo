import { localDate, formatTime } from './date';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const PARTS: Record<string, number> = { morning: 9 * 60, afternoon: 14 * 60, evening: 18 * 60, tonight: 20 * 60, night: 21 * 60 };

export const readQuick = (text: string) => {
  let rest = ` ${text} `;
  let date: string | undefined;
  let time: string | undefined;
  const take = (re: RegExp, use: (m: RegExpMatchArray) => void) => {
    const m = rest.match(re);
    if (!m) return;
    use(m);
    rest = rest.replace(m[0], ' ');
  };
  const shift = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return localDate(d);
  };

  take(/\s(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)(?=\s)/i, (m) => {
    const h = (Number(m[1]) % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0);
    time = formatTime(h * 60 + Number(m[2] || 0));
  });
  take(/\s(?:this\s+|in the\s+)?(morning|afternoon|evening|tonight|night)(?=\s)/i, (m) => {
    time ??= formatTime(PARTS[m[1].toLowerCase()]);
    if (m[1].toLowerCase() === 'tonight') date ??= shift(0);
  });
  take(/\s(today)(?=\s)/i, () => (date = shift(0)));
  take(/\s(day after tomorrow)(?=\s)/i, () => (date = shift(2)));
  take(/\s(tomorrow|tmrw|tmr)(?=\s)/i, () => (date = shift(1)));
  take(/\sin\s+(\d{1,2})\s+days?(?=\s)/i, (m) => (date = shift(Number(m[1]))));
  take(/\s(?:on\s+)?(next\s+)?(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)(?:day|nesday|sday|urday|rsday)?(?=\s)/i, (m) => {
    const target = DAYS.findIndex((d) => d.startsWith(m[2].toLowerCase().slice(0, 3)));
    const gap = (target - new Date().getDay() + 7) % 7 || 7;
    date = shift(gap);
  });
  take(/\s(next week)(?=\s)/i, () => (date = shift(7)));

  return { title: rest.replace(/\s+/g, ' ').trim(), date, time };
};
