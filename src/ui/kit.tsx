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
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Check, ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from '../components/Touchable';
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
  if (!scroll) return <View style={{ flex: 1, backgroundColor: c.bg }}>{children}</View>;
  return (
    <ScrollView
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
  right?: { icon: Icon; label: string; onPress: () => void }[];
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
      {right.map(({ icon: I, label, onPress }) => (
        <TouchableOpacity key={label} style={styles.iconBtn} onPress={onPress} accessibilityLabel={label}>
          <I size={24} color={c.ink} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export const Section: React.FC<{ title?: string; action?: { label: string; onPress: () => void }; children: React.ReactNode }> = ({
  title,
  action,
  children,
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
      {children}
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

export const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 44 }) => {
  const c = useColors();
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
  if (!onPress && !onLongPress) return body;
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.6}>
      {body}
    </TouchableOpacity>
  );
};

export const Fab: React.FC<{ label: string; icon: Icon; onPress: () => void }> = ({ label, icon: I, onPress }) => {
  const styles = useStyles(makeStyles);
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} accessibilityLabel={label}>
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, style]}>
      {options.map((o) => (
        <TouchableOpacity key={o} style={[styles.chip, value === o && styles.chipOn]} onPress={() => onChange(o)}>
          <Text style={[styles.chipText, value === o && styles.chipTextOn]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export const Quick: React.FC<{ items: { label: string; icon: Icon; color: string; onPress: () => void }[] }> = ({ items }) => {
  const styles = useStyles(makeStyles);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
      {items.map(({ label, icon: I, color, onPress }) => (
        <TouchableOpacity key={label} style={styles.quickItem} onPress={onPress} accessibilityLabel={label}>
          <View style={[styles.quickRing, { borderColor: color }]}>
            <View style={[styles.quickInner, { backgroundColor: color }]}>
              <I size={26} color="#FFFFFF" />
            </View>
          </View>
          <T v="caption" center lines={1} style={{ marginTop: 6 }}>
            {label}
          </T>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export const Field: React.FC<
  TextInputProps & { label: string; hint?: string; prefix?: string; error?: string }
> = ({ label, hint, prefix, error, style, ...input }) => {
  const c = useColors();
  const styles = useStyles(makeStyles);
  const scale = useTextScale();
  return (
    <View style={styles.field}>
      <T v="section" style={{ marginBottom: 6 }}>
        {label}
      </T>
      <View style={[styles.inputBox, error ? { borderColor: c.expense } : null, input.multiline && { minHeight: 96, alignItems: 'flex-start' }]}>
        {prefix ? <Text style={[styles.prefix, { fontSize: 17 * scale }]}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={c.textFaint}
          {...input}
          style={[styles.input, { fontSize: 17 * scale }, input.multiline && { textAlignVertical: 'top', paddingTop: 12 }, style]}
        />
      </View>
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

export const Pick: React.FC<{ label: string; options: readonly string[]; value: string; onChange: (v: string) => void }> = ({
  label,
  options,
  value,
  onChange,
}) => (
  <View style={{ marginBottom: 18 }}>
    <T v="section" style={{ marginBottom: 8, paddingHorizontal: 16 }}>
      {label}
    </T>
    <Chips options={options} value={value} onChange={onChange} />
  </View>
);

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
  const bg = variant === 'primary' ? c.accent : variant === 'danger' ? c.expense : c.soft;
  const fg = variant === 'secondary' ? c.ink : '#FFFFFF';
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, style]} onPress={onPress} disabled={disabled}>
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
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 + insets.bottom }} keyboardShouldPersistTaps="handled">
        {children}
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
    section: { marginTop: 16 },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 14, minHeight: 64 },
    rowText: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingRight: 16, minHeight: 64, gap: 6 },
    rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
    check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: c.textFaint, alignItems: 'center', justifyContent: 'center' },
    checkOn: { backgroundColor: c.income, borderColor: c.income },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
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
    chip: { paddingHorizontal: 16, height: 38, borderRadius: 19, backgroundColor: c.soft, justifyContent: 'center' },
    chipOn: { backgroundColor: c.dark ? c.ink : c.inverse },
    chipText: { fontSize: 15, fontWeight: '600', color: c.ink },
    chipTextOn: { color: c.dark ? '#000000' : '#FFFFFF' },
    quickRow: { paddingHorizontal: 12, gap: 6, paddingVertical: 4 },
    quickItem: { width: 76, alignItems: 'center' },
    quickRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
    quickInner: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
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
