import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useScrollToTop } from '@react-navigation/native';
import { ChevronRight, Check, ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from '../components/Touchable';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { localDate } from '../core/date';
import { useColors, useStyles, useTextScale, Palette } from '../core/theme';

export type Icon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const SIZES = {
  title: [28, '800'],
  h2: [20, '700'],
  body: [16, '400'],
  strong: [16, '600'],
  sub: [14, '400'],
  caption: [13, '400'],
  section: [13, '600'],
  big: [34, '800'],
} as const;

type Variant = keyof typeof SIZES;

export const T: React.FC<{
  v?: Variant;
  color?: string;
  center?: boolean;
  lines?: number;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}> = ({ v = 'body', color, center, lines, style, children }) => {
  const c = useColors();
  const scale = useTextScale();
  const [size, weight] = SIZES[v];
  const muted = v === 'sub' || v === 'caption' || v === 'section';
  return (
    <Text
      numberOfLines={lines}
      maxFontSizeMultiplier={1.4}
      style={[
        {
          fontSize: size * scale,
          fontWeight: weight,
          color: color ?? (muted ? c.textMuted : c.ink),
          letterSpacing: v === 'title' || v === 'big' ? -0.5 : 0,
          textAlign: center ? 'center' : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

export const Screen: React.FC<{ children: React.ReactNode; scroll?: boolean; padBottom?: number }> = ({
  children,
  scroll = true,
  padBottom = 120,
}) => {
  const c = useColors();
  const ref = React.useRef<ScrollView>(null);
  useScrollToTop(ref);
  if (!scroll) return <View style={{ flex: 1, backgroundColor: c.bg }}>{children}</View>;
  return (
    <ScrollView
      ref={ref}
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: padBottom }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
};

export const AppBar: React.FC<{
  title: string;
  logo?: React.ReactNode;
  onBack?: () => void;
  right?: { icon?: Icon; node?: React.ReactNode; label: string; onPress: () => void }[];
  big?: boolean;
}> = ({ title, logo, onBack, right = [], big = true }) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.appBar}>
      {onBack ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} accessibilityLabel="Back">
          <ArrowLeft size={24} color={c.ink} />
        </TouchableOpacity>
      ) : null}
      <View style={{ flex: 1 }}>
        {logo ?? (
          <T v={big && !onBack ? 'title' : 'h2'} lines={1}>
            {title}
          </T>
        )}
      </View>
      {right.map(({ icon: I, node, label, onPress }) => (
        <TouchableOpacity key={label} style={styles.iconBtn} onPress={onPress} accessibilityLabel={label}>
          {node ?? (I ? <I size={24} color={c.ink} /> : null)}
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const Section: React.FC<{ title?: string; action?: { label: string; onPress: () => void }; children: React.ReactNode; plain?: boolean }> = ({
  title,
  action,
  children,
  plain,
}) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.section}>
      {title ? (
        <View style={styles.sectionHead}>
          <T v="section">{title}</T>
          {action ? (
            <TouchableOpacity onPress={action.onPress}>
              <T v="sub" color={c.accent} style={{ fontWeight: '600' }}>
                {action.label}
              </T>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
      {plain ? children : <View style={styles.card}>{children}</View>}
    </View>
  );
};

export const IconCircle: React.FC<{ icon: Icon; color: string; size?: number }> = ({ icon: I, color, size = 44 }) => {
  const c = useColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.dark ? c.soft : color + '1A',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <I size={size * 0.48} color={c.shade(color)} />
    </View>
  );
};

export const Avatar: React.FC<{ name: string; size?: number; uri?: string | null }> = ({ name, size = 44, uri }) => {
  const c = useColors();
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.soft }} />;
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: size * 0.4 }}>{initials || '?'}</Text>
    </View>
  );
};

export const Row: React.FC<{
  title: string;
  subtitle?: string;
  icon?: Icon;
  iconColor?: string;
  leading?: React.ReactNode;
  right?: React.ReactNode;
  rightText?: string;
  rightColor?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  chevron?: boolean;
  checked?: boolean;
  onCheck?: () => void;
  danger?: boolean;
  last?: boolean;
  strike?: boolean;
}> = ({ title, subtitle, icon, iconColor, leading, right, rightText, rightColor, onPress, onLongPress, chevron, checked, onCheck, danger, last, strike }) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  const body = (
    <View style={styles.row}>
      {onCheck ? (
        <TouchableOpacity
          style={[styles.check, checked && styles.checkOn]}
          onPress={onCheck}
          accessibilityLabel={checked ? 'Mark not done' : 'Mark done'}
          hitSlop={10}
        >
          {checked ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : null}
        </TouchableOpacity>
      ) : null}
      {leading ?? (icon ? <IconCircle icon={icon} color={iconColor ?? c.accent} /> : null)}
      <View style={[styles.rowText, !last && styles.rowLine]}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <T
            v="strong"
            color={danger ? c.expense : strike ? c.textFaint : undefined}
            style={strike ? { textDecorationLine: 'line-through' } : undefined}
            lines={2}
          >
            {title}
          </T>
          {subtitle ? (
            <T v="sub" lines={2} style={{ marginTop: 2 }}>
              {subtitle}
            </T>
          ) : null}
        </View>
        {rightText ? (
          <T v="strong" color={rightColor}>
            {rightText}
          </T>
        ) : null}
        {right}
        {chevron ? <ChevronRight size={20} color={c.textFaint} /> : null}
      </View>
    </View>
  );
  const press = onPress ?? onCheck;
  if (!press && !onLongPress) return body;
  return (
    <TouchableOpacity onPress={press} onLongPress={onLongPress} activeOpacity={0.6}>
      {body}
    </TouchableOpacity>
  );
};

export const Fab: React.FC<{ label: string; icon: Icon; onPress: () => void }> = ({ label, icon: I, onPress }) => {
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const inTabs = React.useContext(BottomTabBarHeightContext) !== undefined;
  return (
    <TouchableOpacity style={[styles.fab, { bottom: 20 + (inTabs ? 0 : insets.bottom) }]} onPress={onPress} accessibilityLabel={label}>
      <I size={22} color="#FFFFFF" strokeWidth={2.5} />
      <Text style={styles.fabText}>{label}</Text>
    </TouchableOpacity>
  );
};

export const Chips: React.FC<{ options: readonly string[]; value: string; onChange: (v: string) => void; style?: StyleProp<ViewStyle> }> = ({
  options,
  value,
  onChange,
  style,
}) => {
  const styles = useStyles(makeStyles);
  return (
    <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, style]}>
      {options.map((o) => (
        <TouchableOpacity key={o} style={[styles.chip, value === o && styles.chipOn]} onPress={() => onChange(o)}>
          <Text style={[styles.chipText, value === o && styles.chipTextOn]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export const Quick: React.FC<{ items: { label: string; icon: Icon; color: string; onPress: () => void }[] }> = ({ items }) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.quickRow}>
      {items.map(({ label, icon: I, color, onPress }) => (
        <TouchableOpacity key={label} style={styles.quickItem} onPress={onPress} accessibilityLabel={label}>
          <View style={[styles.quickTile, { backgroundColor: c.dark ? c.soft : color + '1A' }]}>
            <I size={24} color={c.shade(color)} />
          </View>
          <T v="caption" center lines={1} style={{ marginTop: 8, fontSize: 12, color: c.ink, fontWeight: '500' }}>
            {label}
          </T>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const Reveal = React.createContext<((view: View | null) => void) | null>(null);

const useReveal = () => {
  const reveal = React.useContext(Reveal);
  const box = React.useRef<View>(null);
  return { box, show: () => reveal?.(box.current) };
};

export const Field: React.FC<
  TextInputProps & { label: string; hint?: string; prefix?: string; error?: string; tall?: boolean; below?: React.ReactNode; suffix?: React.ReactNode }
> = ({ label, hint, prefix, error, style, tall, below, suffix, maxLength, ...input }) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  const scale = useTextScale();
  const { box, show } = useReveal();
  return (
    <View style={styles.field} ref={box}>
      <T v="section" style={{ marginBottom: 6 }}>
        {label}
      </T>
      <View style={[styles.inputBox, error ? { borderColor: c.expense } : null, input.multiline && { minHeight: tall ? 200 : 96, alignItems: 'flex-start' }]}>
        {prefix ? <Text style={[styles.prefix, { fontSize: 17 * scale }]}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={c.textFaint}
          maxLength={maxLength ?? (input.multiline ? 2000 : 60)}
          {...input}
          onFocus={(e) => {
            show();
            input.onFocus?.(e);
          }}
          style={[styles.input, { fontSize: 17 * scale }, input.multiline && { textAlignVertical: 'top', paddingTop: 12, minHeight: tall ? 196 : 92 }, style]}
        />
        {suffix}
      </View>
      {below}
      {error ? (
        <T v="caption" color={c.expense} style={{ marginTop: 4 }}>
          {error}
        </T>
      ) : hint ? (
        <T v="caption" style={{ marginTop: 4 }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
};

export const digitsOf = (v: string) => v.replace(/\D/g, '');
export const localPhone = (v: string) => digitsOf(v).replace(/^(91|0)(?=\d{10}$)/, '').slice(0, 10);
export const showPhone = (v: string) => (localPhone(v) ? `+91 ${localPhone(v).replace(/^(\d{5})(\d)/, '$1 $2')}` : '');
export const callable = (v: string) => (localPhone(v).length === 10 ? `+91${localPhone(v)}` : digitsOf(v));

export const PhoneField: React.FC<{ label: string; value: string; onChange: (v: string) => void; hint?: string }> = ({ label, value, onChange, hint }) => {
  const n = localPhone(value);
  const [left, setLeft] = React.useState(false);
  return (
    <Field
      label={label}
      prefix="+91"
      value={n}
      onChangeText={(v) => onChange(digitsOf(v).slice(0, 10))}
      onFocus={() => setLeft(false)}
      onBlur={() => setLeft(true)}
      keyboardType="number-pad"
      maxLength={10}
      error={left && n && n.length < 10 ? 'Phone number has 10 digits' : undefined}
      hint={hint}
    />
  );
};

export const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());
const MAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'rediffmail.com'];

export const EmailField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => {
  const [user, typed = ''] = value.split('@');
  const ideas = user && !MAIL_DOMAINS.includes(typed) ? MAIL_DOMAINS.filter((d) => d.startsWith(typed.toLowerCase())).slice(0, 4) : [];
  return (
    <Field
      label={label}
      value={value}
      onChangeText={(v) => onChange(v.replace(/\s/g, ''))}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      maxLength={80}
      error={value && !validEmail(value) && !ideas.length ? 'This email does not look right' : undefined}
      below={ideas.length ? <Chips options={ideas.map((d) => `${user}@${d}`)} value="" onChange={onChange} style={{ paddingHorizontal: 0, paddingTop: 8 }} /> : null}
    />
  );
};

export const SuggestField: React.FC<TextInputProps & { label: string; options: readonly string[]; onPick: (v: string) => void; hint?: string; error?: string }> = ({
  options,
  onPick,
  value = '',
  ...rest
}) => {
  const [focus, setFocus] = React.useState(false);
  const q = value.trim().toLowerCase();
  const matches = focus && q ? options.filter((o) => o.toLowerCase().includes(q) && o.toLowerCase() !== q).slice(0, 5) : [];
  return (
    <Field
      {...rest}
      value={value}
      onFocus={() => setFocus(true)}
      onBlur={() => setTimeout(() => setFocus(false), 200)}
      below={
        matches.length ? (
          <Chips
            options={matches}
            value=""
            onChange={(v) => {
              onPick(v);
              setFocus(false);
            }}
            style={{ paddingHorizontal: 0, paddingTop: 8 }}
          />
        ) : null
      }
    />
  );
};

const realDate = (y: string, m: string, d: string) => {
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return y.length === 4 && Number(y) > 1900 && dt.getDate() === Number(d) && dt.getMonth() === Number(m) - 1 && dt <= new Date();
};

export const DateParts: React.FC<{ label: string; value: string; onChange: (v: string) => void; hint?: string }> = ({ label, value, onChange, hint }) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  const scale = useTextScale();
  const [y0, m0, d0] = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-') : ['', '', ''];
  const [parts, setParts] = React.useState({ d: d0, m: m0, y: y0 });
  const refs = { d: React.useRef<TextInput>(null), m: React.useRef<TextInput>(null), y: React.useRef<TextInput>(null) };
  const { box, show } = useReveal();
  const error = parts.d && parts.m && parts.y.length === 4 && !realDate(parts.y, parts.m, parts.d) ? 'This date does not look right' : undefined;
  const set = (k: 'd' | 'm' | 'y', v: string) => {
    const next = { ...parts, [k]: v.replace(/\D/g, '') };
    setParts(next);
    if (k === 'd' && next.d.length === 2) refs.m.current?.focus();
    if (k === 'm' && next.m.length === 2) refs.y.current?.focus();
    const ok = realDate(next.y, next.m, next.d);
    onChange(ok ? `${next.y}-${next.m.padStart(2, '0')}-${next.d.padStart(2, '0')}` : next.d || next.m || next.y ? 'partial' : '');
  };
  const part = (k: 'd' | 'm' | 'y', ph: string, len: number, flex: number) => (
    <View style={[styles.inputBox, { flex }, error ? { borderColor: c.expense } : null]}>
      <TextInput
        ref={refs[k]}
        value={parts[k]}
        onChangeText={(v) => set(k, v)}
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === 'Backspace' && !parts[k] && k !== 'd') (k === 'y' ? refs.m : refs.d).current?.focus();
        }}
        onFocus={show}
        placeholder={ph}
        placeholderTextColor={c.textFaint}
        keyboardType="number-pad"
        maxLength={len}
        accessibilityLabel={`${label} ${ph}`}
        style={[styles.input, { fontSize: 17 * scale, textAlign: 'center' }]}
      />
    </View>
  );
  return (
    <View style={styles.field} ref={box}>
      <T v="section" style={{ marginBottom: 6 }}>
        {label}
      </T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {part('d', 'DD', 2, 1)}
        {part('m', 'MM', 2, 1)}
        {part('y', 'YYYY', 4, 1.6)}
      </View>
      {error || hint ? (
        <T v="caption" color={error ? c.expense : undefined} style={{ marginTop: 4 }}>
          {error ?? hint}
        </T>
      ) : null}
    </View>
  );
};

export const DateField: React.FC<{ label: string; value: string; onChange: (v: string) => void; noYear?: boolean; hint?: string; start?: string; past?: boolean }> = ({ label, value, onChange, noYear, hint, start, past }) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  const scale = useTextScale();
  const [iosOpen, setIosOpen] = React.useState(false);
  if (Platform.OS === 'web') return <Field label={label} value={value} onChangeText={onChange} hint="Like 2030-12-31" />;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const current = valid ? new Date(`${value}T00:00:00`) : start ? new Date(`${start}T00:00:00`) : new Date();
  const pick = (d?: Date) => d && onChange(localDate(d));
  const open = () =>
    Platform.OS === 'android' ? DateTimePickerAndroid.open({ value: current, mode: 'date', maximumDate: past ? new Date() : undefined, onValueChange: (_, d) => pick(d) }) : setIosOpen(!iosOpen);
  return (
    <View style={styles.field}>
      <T v="section" style={{ marginBottom: 6 }}>
        {label}
      </T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity onPress={open} style={[styles.inputBox, { flex: 1, height: 52 }]} accessibilityLabel={label}>
          <Text style={{ fontSize: 17 * scale, color: value ? c.ink : c.textMuted }}>
            {valid ? current.toLocaleDateString('en-IN', noYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short', year: 'numeric' }) : value || 'Choose a date'}
          </Text>
        </TouchableOpacity>
        {value && !noYear ? <Button title="Clear" variant="secondary" style={{ height: 52, paddingHorizontal: 16 }} onPress={() => onChange('')} /> : null}
      </View>
      {iosOpen ? <DateTimePicker value={current} mode="date" display="inline" maximumDate={past ? new Date() : undefined} onChange={(_, d) => pick(d)} /> : null}
      {hint ? (
        <T v="caption" style={{ marginTop: 4 }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
};

export const Segmented: React.FC<{ options: readonly string[]; value: string; onChange: (v: string) => void; style?: StyleProp<ViewStyle> }> = ({ options, value, onChange, style }) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  const scale = useTextScale();
  return (
    <View style={[styles.seg, style]} accessibilityRole="radiogroup">
      {options.map((o) => (
        <TouchableOpacity key={o} onPress={() => onChange(o)} style={[styles.segItem, value === o && { backgroundColor: c.accent }]} accessibilityRole="radio" accessibilityState={{ selected: value === o }}>
          <Text style={[styles.segText, { fontSize: 15 * Math.min(scale, 1.15) }, value === o && { color: '#FFFFFF' }]} numberOfLines={1} adjustsFontSizeToFit>
            {o}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const Pick: React.FC<{ label: string; options: readonly string[]; value: string; onChange: (v: string) => void; columns?: number; meta?: (o: string) => [Icon, string] }> = ({
  label,
  options,
  value,
  onChange,
  columns,
  meta,
}) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  const longest = Math.max(...options.map((o) => o.length));
  const segmented = !columns && !meta && options.length <= 4 && longest <= 12;
  const cols = columns ?? (meta ? 3 : longest <= 4 ? 4 : longest <= 9 ? 3 : 2);
  return (
    <View style={{ marginBottom: 18 }}>
      <T v="section" style={{ marginBottom: 8, paddingHorizontal: 16 }}>
        {label}
      </T>
      {segmented ? (
        <Segmented options={options} value={value} onChange={onChange} style={{ marginHorizontal: 16 }} />
      ) : (
        <View style={styles.grid} accessibilityRole="radiogroup">
          {options.map((o) => {
            const on = value === o;
            const [I, color] = meta ? meta(o) : [null, ''];
            return (
              <TouchableOpacity key={o} style={[styles.gridItem, { width: `${100 / cols}%` }]} onPress={() => onChange(o)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={o}>
                <View style={[meta ? styles.tile : styles.gridChip, on && styles.tileOn]}>
                  {I ? (
                    <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: c.dark ? c.soft : color + '1A', marginBottom: 6 }}>
                      <I size={19} color={c.shade(color)} />
                    </View>
                  ) : null}
                  <Text style={[styles.chipText, { textAlign: 'center', fontSize: meta ? 13 : 15 }, on && { color: c.accent }]} numberOfLines={2} adjustsFontSizeToFit>
                    {o}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

export const ToggleRow: React.FC<{ title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void; icon?: Icon; iconColor?: string; last?: boolean }> = ({
  title,
  subtitle,
  value,
  onChange,
  icon,
  iconColor,
  last,
}) => {
  const c = useColors();
  return (
    <Row
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconColor={iconColor}
      last={last}
      onPress={() => onChange(!value)}
      right={<Switch value={value} onValueChange={onChange} trackColor={{ false: c.line, true: c.accent }} thumbColor="#FFFFFF" />}
    />
  );
};

export const Button: React.FC<{ title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; icon?: Icon; disabled?: boolean; style?: StyleProp<ViewStyle> }> = ({
  title,
  onPress,
  variant = 'primary',
  icon: I,
  disabled,
  style,
}) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  const bg = variant === 'primary' ? c.accent : variant === 'danger' ? c.expense : c.raised;
  const fg = variant === 'secondary' ? c.ink : '#FFFFFF';
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, variant === 'secondary' && styles.outlined, style]} onPress={onPress} disabled={disabled}>
      {I ? <I size={20} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </TouchableOpacity>
  );
};

export const Empty: React.FC<{ icon: Icon; title: string; text?: string; action?: { label: string; onPress: () => void } }> = ({ icon: I, title, text, action }) => {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <I size={32} color={c.textMuted} />
      </View>
      <T v="h2" center>
        {title}
      </T>
      {text ? (
        <T v="sub" center style={{ marginTop: 6 }}>
          {text}
        </T>
      ) : null}
      {action ? <Button title={action.label} onPress={action.onPress} style={{ marginTop: 18, alignSelf: 'stretch' }} /> : null}
    </View>
  );
};

export const Form: React.FC<{ title: string; onCancel: () => void; onSave?: () => void; saveLabel?: string; canSave?: boolean; children: React.ReactNode }> = ({
  title,
  onCancel,
  onSave,
  saveLabel = 'Save',
  canSave = true,
  children,
}) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const scroll = React.useRef<ScrollView>(null);
  const offset = React.useRef(0);
  const reveal = React.useCallback((view: View | null) => {
    setTimeout(() => {
      const list = scroll.current as unknown as View | null;
      if (!view || !list) return;
      list.measureInWindow((_, listY, __, listH) =>
        view.measureInWindow((___, y, ____, h) => {
          if (y >= listY && y + h <= listY + listH) return;
          scroll.current?.scrollTo({ y: Math.max(0, offset.current + y - listY - 24), animated: true });
        })
      );
    }, 350);
  }, []);
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior="padding">
      <View style={[styles.formHead, { paddingTop: Platform.OS === 'ios' ? 12 : 8 }]}>
        <TouchableOpacity onPress={onCancel} style={styles.formHeadBtn}>
          <T v="body" color={c.accent}>
            Cancel
          </T>
        </TouchableOpacity>
        <T v="strong" center style={{ flex: 1 }} lines={1}>
          {title}
        </T>
        {onSave ? (
          <TouchableOpacity onPress={onSave} disabled={!canSave} style={[styles.formHeadBtn, { alignItems: 'flex-end' }]}>
            <T v="strong" color={canSave ? c.accent : c.textFaint}>
              {saveLabel}
            </T>
          </TouchableOpacity>
        ) : (
          <View style={styles.formHeadBtn} />
        )}
      </View>
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        onScroll={(e) => (offset.current = e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={32}
      >
        <Reveal.Provider value={reveal}>{children}</Reveal.Provider>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const Divider: React.FC = () => {
  const c = useColors();
  return <View style={{ height: 8, backgroundColor: c.soft }} />;
};

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    appBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, minHeight: 56, gap: 4 },
    iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
    section: { marginTop: 20 },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 14, minHeight: 64 },
    rowText: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingRight: 16, minHeight: 64, gap: 6 },
    rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
    check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: c.textFaint, alignItems: 'center', justifyContent: 'center' },
    checkOn: { backgroundColor: c.income, borderColor: c.income },
    fab: {
      position: 'absolute',
      right: 16,
      height: 56,
      paddingHorizontal: 20,
      borderRadius: 18,
      backgroundColor: c.accent,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 6,
    },
    fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    chips: { paddingHorizontal: 16, gap: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
    gridItem: { padding: 4 },
    gridChip: { minHeight: 48, borderRadius: 14, backgroundColor: c.raised, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 6 },
    chip: { paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: c.raised, borderWidth: 1, borderColor: c.line, justifyContent: 'center' },
    outlined: { borderWidth: 1, borderColor: c.line },
    card: { marginHorizontal: 16, borderRadius: 22, backgroundColor: c.card, overflow: 'hidden' },
    chipOn: { backgroundColor: c.accent, borderColor: c.accent },
    seg: { flexDirection: 'row', backgroundColor: c.raised, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: c.line },
    segItem: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    segText: { fontWeight: '600', color: c.ink },
    tile: { minHeight: 92, borderRadius: 18, backgroundColor: c.raised, borderWidth: 1.5, borderColor: c.line, alignItems: 'center', justifyContent: 'center', padding: 8 },
    tileOn: { borderColor: c.accent, borderWidth: 2, backgroundColor: c.accentSoft },
    chipText: { fontSize: 15, fontWeight: '600', color: c.ink },
    chipTextOn: { color: '#FFFFFF' },
    quickRow: { flexDirection: 'row', marginHorizontal: 16, paddingVertical: 14, paddingHorizontal: 4, borderRadius: 22, backgroundColor: c.card },
    quickItem: { flex: 1, alignItems: 'center' },
    quickTile: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    field: { paddingHorizontal: 16, marginBottom: 18 },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 54,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: c.line,
      backgroundColor: c.card,
      paddingHorizontal: 14,
    },
    prefix: { color: c.textMuted, marginRight: 6, fontWeight: '600' },
    input: { flex: 1, color: c.ink, paddingVertical: 12, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
    button: { height: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
    buttonText: { fontSize: 17, fontWeight: '700' },
    formHead: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.line,
    },
    formHeadBtn: { width: 84, paddingHorizontal: 8, paddingVertical: 8 },
  });

export const ActionSheet: React.FC<{ visible: boolean; title: string; onClose: () => void; options: { title: string; sub?: string; icon: Icon; color: string; onPress: () => void }[] }> = ({ visible, title, onClose, options }) => {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: c.overlay }} onPress={onClose} accessibilityLabel="Close" />
      <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 10, paddingBottom: 16 + insets.bottom }}>
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.line, marginBottom: 12 }} />
        <T v="h2" style={{ paddingHorizontal: 24, marginBottom: 8 }}>
          {title}
        </T>
        <View style={{ marginHorizontal: 16, borderRadius: 22, backgroundColor: c.card, overflow: 'hidden' }}>
          {options.map((o, i) => (
            <Row
              key={o.title}
              icon={o.icon}
              iconColor={o.color}
              title={o.title}
              subtitle={o.sub}
              chevron
              onPress={() => {
                onClose();
                o.onPress();
              }}
              last={i === options.length - 1}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
};
