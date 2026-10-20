import { create } from 'zustand';
import { localDate } from '../../core/date';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../../core/storage/persistStorage';

export type TodoPriority = 'High' | 'Medium' | 'Low';
export type TodoCategory = 'Personal' | 'Work' | 'Home' | 'Study' | 'Health';

export interface TodoItem {
  id: string;
  title: string;
  category: TodoCategory;
  priority: TodoPriority;
  dueDate: string;
  dueTime?: string;
  isCompleted: boolean;
  createdAt: string;
  xpValue: number;
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface AlarmItem {
  id: string;
  time: string;
  label: string;
  isEnabled: boolean;
  days: DayOfWeek[];
  vibrate: boolean;
}

export type EventType = 'Personal' | 'Work' | 'Meeting' | 'Birthday' | 'Class' | 'Exam';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: EventType;
  location?: string;
  notes?: string;
}

export interface AttendanceLog {
  date: string;
  status: 'Present' | 'Absent' | 'Cancelled';
}

export interface StudentSubject {
  id: string;
  name: string;
  code: string;
  faculty?: string;
  room?: string;
  attendedClasses: number;
  totalClasses: number;
  targetPercentage: number;
  logs: AttendanceLog[];
}

export interface RoutineTask {
  id: string;
  title: string;
  category: string;
  recurrence: string;
  scheduledTime: string;
  isCompleted: boolean;
  xpValue: number;
}

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: 'Housing' | 'Food' | 'Transport' | 'Utilities' | 'Leisure' | 'Health' | 'Tech';
  date: string;
}

export interface StudentOpsState {
  todos: TodoItem[];
  alarms: AlarmItem[];
  calendarEvents: CalendarEvent[];
  studentSubjects: StudentSubject[];

  tasks: RoutineTask[];
  expenses: ExpenseItem[];

  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'isCompleted' | 'xpValue'>) => void;
  toggleTodo: (id: string) => void;
  updateTodo: (id: string, todo: Partial<TodoItem>) => void;
  updateAlarm: (id: string, alarm: Partial<AlarmItem>) => void;
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteTodo: (id: string) => void;

  addAlarm: (alarm: Omit<AlarmItem, 'id'>) => void;
  toggleAlarm: (id: string) => void;
  deleteAlarm: (id: string) => void;

  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  deleteCalendarEvent: (id: string) => void;

  addStudentSubject: (sub: Omit<StudentSubject, 'id' | 'logs'>) => void;
  markAttendance: (subjectId: string, status: 'Present' | 'Absent' | 'Cancelled') => void;
  deleteStudentSubject: (subjectId: string) => void;
  resetSubjectAttendance: (subjectId: string) => void;

  toggleTask: (id: string) => void;
  addTask: (task: any) => void;
  addExpense: (item: Omit<ExpenseItem, 'id'>) => void;
  deleteExpense: (id: string) => void;
}

const syncTasksFromTodos = (todos: TodoItem[]): RoutineTask[] => {
  return todos.map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
    recurrence: 'Daily',
    scheduledTime: t.dueTime || 'Today',
    isCompleted: t.isCompleted,
    xpValue: t.xpValue,
  }));
};

export const useFinanceOpsStore = create<StudentOpsState>()(
  persist((set, get) => ({
  todos: [],
  alarms: [],
  calendarEvents: [],
  studentSubjects: [],
  tasks: [],
  expenses: [],

  addTodo: (todo) => {
    const newItem: TodoItem = {
      ...todo,
      id: 'todo-' + Date.now(),
      isCompleted: false,
      createdAt: localDate(),
      xpValue: todo.priority === 'High' ? 35 : todo.priority === 'Medium' ? 25 : 15,
    };
    const nextTodos = [newItem, ...get().todos];
    set({
      todos: nextTodos,
      tasks: syncTasksFromTodos(nextTodos),
    });
  },

  updateTodo: (id, todo) => {
    const nextTodos = get().todos.map((t) => (t.id === id ? { ...t, ...todo } : t));
    set({ todos: nextTodos, tasks: syncTasksFromTodos(nextTodos) });
  },

  updateAlarm: (id, alarm) => set({ alarms: get().alarms.map((a) => (a.id === id ? { ...a, ...alarm } : a)) }),

  updateCalendarEvent: (id, event) =>
    set({ calendarEvents: get().calendarEvents.map((e) => (e.id === id ? { ...e, ...event } : e)) }),

  toggleTodo: (id) => {
    const nextTodos = get().todos.map((t) =>
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    );
    set({
      todos: nextTodos,
      tasks: syncTasksFromTodos(nextTodos),
    });
  },

  deleteTodo: (id) => {
    const nextTodos = get().todos.filter((t) => t.id !== id);
    set({
      todos: nextTodos,
      tasks: syncTasksFromTodos(nextTodos),
    });
  },

  addAlarm: (alarm) => {
    const newAlarm: AlarmItem = {
      ...alarm,
      id: 'alarm-' + Date.now(),
    };
    set({ alarms: [...get().alarms, newAlarm] });
  },

  toggleAlarm: (id) => {
    set({
      alarms: get().alarms.map((a) =>
        a.id === id ? { ...a, isEnabled: !a.isEnabled } : a
      ),
    });
  },

  deleteAlarm: (id) => {
    set({ alarms: get().alarms.filter((a) => a.id !== id) });
  },

  addCalendarEvent: (event) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: 'ev-' + Date.now(),
    };
    set({ calendarEvents: [...get().calendarEvents, newEvent] });
  },

  deleteCalendarEvent: (id) => {
    set({
      calendarEvents: get().calendarEvents.filter((e) => e.id !== id),
    });
  },

  addStudentSubject: (sub) => {
    const newSub: StudentSubject = {
      ...sub,
      id: 'sub-' + Date.now(),
      logs: [],
    };
    set({ studentSubjects: [...get().studentSubjects, newSub] });
  },

  markAttendance: (subjectId, status) => {
    const today = localDate();
    set({
      studentSubjects: get().studentSubjects.map((s) => {
        if (s.id !== subjectId) return s;
        if (status === 'Cancelled') {
          return {
            ...s,
            logs: [{ date: today, status }, ...s.logs],
          };
        }
        const isPresent = status === 'Present';
        return {
          ...s,
          attendedClasses: isPresent ? s.attendedClasses + 1 : s.attendedClasses,
          totalClasses: s.totalClasses + 1,
          logs: [{ date: today, status }, ...s.logs],
        };
      }),
    });
  },

  deleteStudentSubject: (subjectId) => {
    set({
      studentSubjects: get().studentSubjects.filter((s) => s.id !== subjectId),
    });
  },

  resetSubjectAttendance: (subjectId) => {
    set({
      studentSubjects: get().studentSubjects.map((s) =>
        s.id === subjectId
          ? { ...s, attendedClasses: 0, totalClasses: 0, logs: [] }
          : s
      ),
    });
  },

  toggleTask: (id) => {
    get().toggleTodo(id);
  },

  addTask: (task) => {
    get().addTodo({
      title: task.title,
      category: 'Personal',
      priority: 'Medium',
      dueDate: localDate(),
      dueTime: task.scheduledTime || 'Today',
    });
  },

  addExpense: (item) => {
    const e: ExpenseItem = { ...item, id: 'e-' + Date.now() };
    set((state) => ({ expenses: [e, ...state.expenses] }));
  },

  deleteExpense: (id) => {
    set((state) => ({ expenses: state.expenses.filter((x) => x.id !== id) }));
  },
}), { name: 'lifeos-planner', storage: persistStorage })
);

export const useStudentOpsStore = useFinanceOpsStore;
