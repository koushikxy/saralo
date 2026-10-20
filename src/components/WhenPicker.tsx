import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { TouchableOpacity } from './Touchable';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Clock, CalendarDays, X } from 'lucide-react-native';
import { radius, space, useColors, useStyles, Palette } from '../core/theme';
import { localDate, parseTime, formatTime } from '../core/date';

type Props = {
  date?: string;
  time?: string;
  onChangeDate?: (date: string) => void;
  onChangeTime: (time: string) => void;
  timeLabel?: string;
  allowNoTime?: boolean;
  hideTime?: boolean;
  past?: boolean;
};

const toDate = (date?: string, time?: string) => {
  const d = date ? new Date(`${date}T00:00:00`) : new Date();
  const minutes = parseTime(time);
  d.setHours(minutes === null ? 9 : Math.floor(minutes / 60), minutes === null ? 0 : minutes % 60, 0, 0);
  return d;
};

export const WhenPicker: React.FC<Props> = ({ date, time, onChangeDate, onChangeTime, timeLabel = 'Add time', allowNoTime = true, hideTime, past }) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  const [iosMode, setIosMode] = useState<'date' | 'time' | null>(null);
  const today = localDate();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + (past ? -1 : 1));
  const tomorrow = localDate(tomorrowDate);

  const apply = (mode: 'date' | 'time', picked: Date) => {
    if (mode === 'date') onChangeDate?.(localDate(picked));
    else onChangeTime(formatTime(picked.getHours() * 60 + picked.getMinutes()));
  };

  const open = (mode: 'date' | 'time') => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: toDate(date, time), mode, maximumDate: past && mode === 'date' ? new Date() : undefined, onValueChange: (_, picked) => apply(mode, picked) });
    } else {
      setIosMode(iosMode === mode ? null : mode);
    }
  };

  const dateLabel =
    date === today
      ? 'Today'
      : date === tomorrow
      ? 'Tomorrow'
      : date
      ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
      : 'Pick date';

  return (
    <View>
      {onChangeDate && (
        <View style={styles.row}>
          {[
            { label: 'Today', value: today },
            { label: past ? 'Yesterday' : 'Tomorrow', value: tomorrow },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.chip, date === opt.value && styles.chipActive]}
              onPress={() => onChangeDate(opt.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, date === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.chip, date !== today && date !== tomorrow && !!date && styles.chipActive]}
              onPress={() => open('date')}
              activeOpacity={0.8}
            >
              <CalendarDays size={14} color={date !== today && date !== tomorrow && date ? '#FFFFFF' : c.ink} />
              <Text style={[styles.chipText, date !== today && date !== tomorrow && !!date && styles.chipTextActive]}>
                {date !== today && date !== tomorrow ? dateLabel : 'Other day'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {onChangeDate && Platform.OS === 'web' ? (
        <TextInput
          style={styles.webInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={c.textFaint}
          value={date}
          onChangeText={onChangeDate}
        />
      ) : null}

      {hideTime ? null : Platform.OS === 'web' ? (
        <TextInput
          style={styles.webInput}
          placeholder="Time, e.g. 6:30 PM"
          placeholderTextColor={c.textFaint}
          value={time}
          onChangeText={onChangeTime}
        />
      ) : (
        <View style={styles.row}>
          <TouchableOpacity style={[styles.chip, !!time && styles.chipActive]} onPress={() => open('time')} activeOpacity={0.8}>
            <Clock size={14} color={time ? '#FFFFFF' : c.ink} />
            <Text style={[styles.chipText, !!time && styles.chipTextActive]}>{time || timeLabel}</Text>
          </TouchableOpacity>
          {!!time && allowNoTime && (
            <TouchableOpacity style={styles.clear} onPress={() => onChangeTime('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Close">
              <X size={14} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {Platform.OS === 'ios' && iosMode && (
        <DateTimePicker
          value={toDate(date, time)}
          mode={iosMode}
          maximumDate={past && iosMode === 'date' ? new Date() : undefined}
          display="spinner"
          minuteInterval={5}
          onValueChange={(_, picked) => apply(iosMode, picked)}
        />
      )}
    </View>
  );
};

const makeStyles = (c: Palette) =>
  StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: c.soft,
  },
  chipActive: { backgroundColor: c.accent },
  chipText: { fontSize: 13, fontWeight: '600', color: c.ink },
  chipTextActive: { color: '#FFFFFF' },
  clear: { padding: 4 },
  webInput: {
    backgroundColor: c.soft,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 14,
    color: c.ink,
    marginBottom: space.sm,
  },
});
