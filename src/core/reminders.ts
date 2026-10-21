import { Platform } from 'react-native';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { parseTime, localDate } from './date';

const Notifications = {
  scheduleNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  AndroidImportance,
};
import { useFinanceOpsStore, DayOfWeek } from '../modules/finance/financeStore';
import { useLifeStore, lowStock } from '../modules/life/lifeStore';
import { useHealthStore } from '../modules/health/healthStore';
import { useProfileStore } from '../modules/profile/profileStore';
import { useWalletStore, WalletTransaction } from '../modules/wallet/walletStore';

const CHANNEL = 'reminders';
const WEEKDAY_NUMBER: Record<DayOfWeek, number> = { Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6, Sat: 7 };
const EVENT_LEAD_MINUTES = 10;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let ready: Promise<boolean> | null = null;

const ensureReady = () =>
  (ready ??= (async () => {
    if (Platform.OS === 'web') return false;
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL, {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) return true;
      return (await Notifications.requestPermissionsAsync()).granted;
    } catch {
      return false;
    }
  })());

export const remindersAvailable = () => ensureReady();

const at = (date: string, minutes: number) => {
  const d = new Date(`${date}T00:00:00`);
  d.setMinutes(minutes);
  return d;
};

export const syncReminders = async () => {
  if (!(await ensureReady())) return;
  const { alarms, todos, calendarEvents } = useFinanceOpsStore.getState();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  const jobs: Promise<string>[] = [];

  for (const alarm of alarms.filter((a) => a.isEnabled)) {
    const minutes = parseTime(alarm.time);
    if (minutes === null) continue;
    const content = { title: alarm.label || 'Reminder', body: alarm.time };
    const time = { hour: Math.floor(minutes / 60), minute: minutes % 60, channelId: CHANNEL };
    if (alarm.days.length === 0 || alarm.days.length === 7) {
      jobs.push(Notifications.scheduleNotificationAsync({ content, trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...time } }));
    } else {
      for (const day of alarm.days) {
        jobs.push(
          Notifications.scheduleNotificationAsync({
            content,
            trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: WEEKDAY_NUMBER[day], ...time },
          })
        );
      }
    }
  }

  for (const todo of todos.filter((t) => !t.isCompleted)) {
    const minutes = parseTime(todo.dueTime);
    if (minutes === null) continue;
    const date = at(todo.dueDate, minutes);
    if (date.getTime() <= now) continue;
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: { title: todo.title, body: 'To-do due now' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
      })
    );
  }

  for (const event of calendarEvents) {
    const minutes = parseTime(event.startTime);
    if (minutes === null) continue;
    const date = at(event.date, minutes - EVENT_LEAD_MINUTES);
    if (date.getTime() <= now) continue;
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: { title: event.title, body: `Starts at ${event.startTime}${event.location ? ` · ${event.location}` : ''}` },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
      })
    );
  }

  const { medicines, bills, specialDays } = useLifeStore.getState();
  for (const med of medicines) {
    for (const t of med.times) {
      const minutes = parseTime(t);
      if (minutes === null) continue;
      jobs.push(
        Notifications.scheduleNotificationAsync({
          content: { title: `Time for ${med.name}`, body: med.dose ? `Take ${med.dose}` : 'Medicine reminder' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: Math.floor(minutes / 60), minute: minutes % 60, channelId: CHANNEL },
        })
      );
    }
  }
  for (const bill of bills) {
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: { title: `${bill.name} is due today`, body: bill.amount ? `₹${bill.amount.toLocaleString('en-IN')}` : 'Bill reminder' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: Math.min(bill.dueDay, 28), hour: 9, minute: 0, channelId: CHANNEL },
      })
    );
  }
  for (const bill of bills.filter((b) => b.dueDay > 1)) {
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: { title: `${bill.name} is due tomorrow`, body: bill.amount ? `₹${bill.amount.toLocaleString('en-IN')}` : 'Bill reminder' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: Math.min(bill.dueDay - 1, 28), hour: 19, minute: 0, channelId: CHANNEL },
      })
    );
  }
  const tomorrow9 = new Date();
  tomorrow9.setDate(tomorrow9.getDate() + 1);
  tomorrow9.setHours(9, 0, 0, 0);
  for (const med of medicines.filter(lowStock)) {
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: { title: `Refill ${med.name}`, body: med.stock ? `Only ${med.stock} left` : 'You have run out' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow9, channelId: CHANNEL },
      })
    );
  }
  if (useHealthStore.getState().waterReminders) {
    for (const hour of [10, 12, 14, 16, 18, 20]) {
      jobs.push(
        Notifications.scheduleNotificationAsync({
          content: { title: 'Time for some water', body: 'Have a glass and add it in Saralo' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: CHANNEL },
        })
      );
    }
  }
  for (const doc of useProfileStore.getState().documents.filter((d) => d.expiryDate)) {
    const expiry = new Date(`${doc.expiryDate}T09:00:00`);
    const name = doc.docType === 'Other' ? doc.title : doc.docType;
    const before = new Date(expiry.getTime() - 30 * 86400000);
    if (before.getTime() > now)
      jobs.push(
        Notifications.scheduleNotificationAsync({
          content: { title: `Your ${name} expires in 30 days`, body: 'Start the renewal now so you are not stuck later' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: before, channelId: CHANNEL },
        })
      );
    if (expiry.getTime() > now)
      jobs.push(
        Notifications.scheduleNotificationAsync({
          content: { title: `Your ${name} expires today`, body: 'Renew it as soon as you can' },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: expiry, channelId: CHANNEL },
        })
      );
  }
  const { lastBackup } = useProfileStore.getState();
  if (!lastBackup || Date.now() - new Date(`${lastBackup}T00:00:00`).getTime() > 30 * 86400000) {
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: { title: 'Back up your Saralo data', body: 'Everything is only on this phone. A backup keeps it safe if you lose or change your phone.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 20, minute: 0, channelId: CHANNEL },
      })
    );
  }
  for (const day of specialDays) {
    const [month, date] = day.date.split('-').map(Number);
    jobs.push(
      Notifications.scheduleNotificationAsync({
        content: { title: `${day.name}'s ${day.kind === 'Other' ? 'special day' : day.kind.toLowerCase()} is today`, body: 'Send your wishes' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.YEARLY, month: month - 1, day: date, hour: 9, minute: 0, channelId: CHANNEL },
      })
    );
  }

  await Promise.all(jobs);
};

export const sendTestReminder = async () => {
  if (!(await ensureReady())) return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Saralo', body: 'Reminders are working.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: CHANNEL },
    });
    return true;
  } catch {
    return false;
  }
};

const notifyNow = async (title: string, body: string) => {
  if (!(await ensureReady())) return;
  Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: CHANNEL },
  }).catch(() => {});
};

const spentThisMonth = (list: WalletTransaction[]) => {
  const month = localDate().slice(0, 7);
  return list.filter((t) => t.type === 'EXPENSE' && t.date.startsWith(month)).reduce((s, t) => s + t.amount, 0);
};

export const watchReminders = () => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  syncReminders().catch(() => {});
  const resync = () => {
    clearTimeout(timer);
    timer = setTimeout(() => syncReminders().catch(() => {}), 800);
  };
  const stopPlanner = useFinanceOpsStore.subscribe((state, prev) => {
    if (state.alarms !== prev.alarms || state.todos !== prev.todos || state.calendarEvents !== prev.calendarEvents) resync();
  });
  const stopLife = useLifeStore.subscribe((state, prev) => {
    if (state.medicines !== prev.medicines || state.bills !== prev.bills || state.specialDays !== prev.specialDays) resync();
  });
  const stopHealth = useHealthStore.subscribe((state, prev) => {
    if (state.waterReminders !== prev.waterReminders) resync();
  });
  const stopDocs = useProfileStore.subscribe((state, prev) => {
    if (state.documents !== prev.documents || state.lastBackup !== prev.lastBackup) resync();
  });
  const stopBudget = useWalletStore.subscribe((state, prev) => {
    const budget = state.monthlyBudget;
    if (!budget || state.transactions === prev.transactions) return;
    const before = spentThisMonth(prev.transactions);
    const after = spentThisMonth(state.transactions);
    const rupee = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
    if (before < budget && after >= budget) notifyNow('You crossed your monthly budget', `Spent ${rupee(after)} of ${rupee(budget)} this month.`);
    else if (before < budget * 0.8 && after >= budget * 0.8) notifyNow('80% of your budget is used', `${rupee(budget - after)} left for the rest of the month.`);
  });
  return () => {
    stopPlanner();
    stopLife();
    stopHealth();
    stopDocs();
    stopBudget();
  };
};
