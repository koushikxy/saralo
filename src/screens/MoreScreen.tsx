import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { View, Image, Linking, ActivityIndicator, Modal, Pressable, AppState, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import {
  HeartPulse,
  Phone,
  Landmark,
  QrCode,
  Target,
  Shirt,
  Cake,
  Sun,
  Lock,
  CloudUpload,
  ShieldCheck,
  Trash2,
  Camera,
  Dumbbell,
  Pencil,
  Eye,
  Share2,
  X,
  KeyRound,
  Mail,
  User,
} from 'lucide-react-native';
import { Screen, AppBar, Section, Row, Avatar, T, Form, Field, Pick, Button, ToggleRow, Segmented, PhoneField, EmailField, DateParts, showPhone, callable, validEmail, localPhone } from '../ui/kit';
import { useColors } from '../core/theme';
import { confirmAction } from '../core/confirm';
import { hashPin, checkPin, lockSecondsLeft } from '../core/security/pin';
import { MediaPickerService } from '../core/storage/mediaPickerService';
import { exportBackup, pickBackupFile, restoreBackup, wipeAllData } from '../core/storage/backup';
import { useProfileStore, ThemeMode, TextSize } from '../modules/profile/profileStore';
import { VAULT_INFO, VaultKind } from './vault/VaultScreens';
import { VaultGate } from './vault/VaultGate';
import { POLICY, POLICY_UPDATED } from '../core/privacy';
import { autofillSupported, autofillEnabled, openAutofillSettings } from '../core/autofill';

const removeFile = (uri: string | null) => {
  if (!uri || Platform.OS === 'web') return;
  try {
    new File(uri).delete();
  } catch {}
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const { profile } = useProfileStore(useShallow(({ profile }) => ({ profile })));
  const dob = /^\d{4}-\d{2}-\d{2}$/.test(profile.dob) ? new Date(`${profile.dob}T00:00:00`) : null;
  const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 86400000)) : null;
  return (
    <Screen padBottom={32}>
      <AppBar title="Profile" onBack={() => navigation.goBack()} right={[{ icon: Pencil, label: 'Edit profile', onPress: () => navigation.navigate('ProfileForm') }]} />
      <View style={{ alignItems: 'center', paddingVertical: 12 }}>
        <Avatar name={profile.name} uri={profile.profilePhotoUri} size={112} />
        <T v="title" style={{ marginTop: 12 }}>
          {profile.name}
        </T>
        {age !== null ? <T v="sub">{age} years old</T> : null}
      </View>
      <Section>
        <Row icon={Phone} iconColor="#059669" title="Phone" subtitle={showPhone(profile.phone) || 'Not added'} onPress={() => navigation.navigate('ProfileForm')} />
        <Row icon={Mail} iconColor="#2563EB" title="Email" subtitle={profile.email || 'Not added'} onPress={() => navigation.navigate('ProfileForm')} />
        <Row icon={User} iconColor="#0F766E" title="About you" subtitle={[profile.gender, profile.diet, profile.weightKg ? `${profile.weightKg} kg` : '', profile.activity].filter(Boolean).join(' · ') || 'Add for better goals and outfit ideas'} onPress={() => navigation.navigate('ProfileForm')} />
        <Row icon={Cake} iconColor="#C026D3" title="Date of birth" subtitle={dob ? dob.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not added'} onPress={() => navigation.navigate('ProfileForm')} last />
      </Section>
      <Section>
        <Row icon={HeartPulse} iconColor="#DC2626" title="Medical ID" subtitle={profile.bloodGroup ? `Blood group ${profile.bloodGroup}` : 'Blood group, allergies, emergency contact'} chevron onPress={() => navigation.navigate('MedicalId')} last />
      </Section>
      {profile.profilePhotoUri ? (
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Button title="Share passport size photo" icon={Share2} variant="secondary" onPress={() => Sharing.shareAsync(profile.profilePhotoUri!, { mimeType: 'image/jpeg' }).catch(() => {})} />
        </View>
      ) : null}
    </Screen>
  );
};

export const MoreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { profile, lastBackup } = useProfileStore(useShallow(({ profile, lastBackup }) => ({ profile, lastBackup })));

  return (
    <Screen padBottom={32}>
      <AppBar title="More" />
      <Section title="Private (locked with your PIN)">
        {(Object.keys(VAULT_INFO) as VaultKind[]).map((k, i, arr) => (
          <Row key={k} icon={VAULT_INFO[k].icon} iconColor={VAULT_INFO[k].color} title={VAULT_INFO[k].title} chevron onPress={() => navigation.navigate('VaultList', { type: k })} last={i === arr.length - 1} />
        ))}
      </Section>

      <Section title="Safety">
        <Row
          icon={HeartPulse}
          iconColor="#DC2626"
          title="Medical ID"
          subtitle={[profile.bloodGroup && `Blood group ${profile.bloodGroup}`, profile.emergencyContactName && `Emergency: ${profile.emergencyContactName}`].filter(Boolean).join(' · ') || 'Blood group, allergies, emergency contact'}
          chevron
          onPress={() => navigation.navigate('MedicalId')}
          last
        />
      </Section>

      <Section title="Closet">
        <Row icon={Shirt} iconColor="#7C3AED" title="Outfits and closet" subtitle="What to wear, laundry and your clothes" chevron onPress={() => navigation.navigate('Outfits')} last />
      </Section>

      <Section title="App">
        <Row icon={Sun} iconColor="#F59E0B" title="Appearance and text size" chevron onPress={() => navigation.navigate('Appearance')} />
        <Row icon={Lock} iconColor="#4F46E5" title="App lock and PIN" chevron onPress={() => navigation.navigate('Security')} />
        <Row
          icon={CloudUpload}
          iconColor="#0284C7"
          title="Backup and restore"
          subtitle={lastBackup ? `Last backup ${new Date(`${lastBackup}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No backup yet. Your data is only on this phone.'}
          chevron
          onPress={() => navigation.navigate('Backup')}
        />
        <Row icon={ShieldCheck} iconColor="#059669" title="Privacy policy" chevron onPress={() => navigation.navigate('Privacy')} />
        <Row
          icon={Trash2}
          iconColor="#E11D48"
          title="Delete all my data"
          danger
          onPress={() =>
            confirmAction(
              'Delete everything?',
              'This removes all your Saralo data from this phone. Make a backup first if you want to keep it. This cannot be undone.',
              'Delete everything',
              () => wipeAllData()
            )
          }
          last
        />
      </Section>
      <T v="caption" center style={{ marginTop: 20 }}>
        Saralo 1.0.0 · Your data stays on this phone
      </T>
    </Screen>
  );
};

const PhotoActions: React.FC<{ uri: string | null; onChange: (uri: string | null) => void; aspect: [number, number]; changeLabel: string }> = ({ uri, onChange, aspect, changeLabel }) => {
  const [big, setBig] = useState(false);
  const change = async () => {
    const u = await MediaPickerService.choose(aspect);
    if (u) onChange(u);
  };
  return (
    <>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, paddingHorizontal: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {uri ? <Button title="View" icon={Eye} variant="secondary" style={{ height: 44 }} onPress={() => setBig(true)} /> : null}
        {uri ? <Button title="Share" icon={Share2} variant="secondary" style={{ height: 44 }} onPress={() => Sharing.shareAsync(uri, { mimeType: 'image/jpeg' }).catch(() => {})} /> : null}
        <Button title={uri ? 'Change' : changeLabel} icon={Camera} variant="secondary" style={{ height: 44 }} onPress={change} />
        {uri ? <Button title="Remove" icon={Trash2} variant="secondary" style={{ height: 44 }} onPress={() => onChange(null)} /> : null}
      </View>
      <Modal visible={big} transparent animationType="fade" onRequestClose={() => setBig(false)}>
        <Pressable style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center' }} onPress={() => setBig(false)}>
          {uri ? <Image source={{ uri }} style={{ width: '100%', height: '80%' }} resizeMode="contain" /> : null}
          <View style={{ position: 'absolute', top: 40, right: 16, padding: 8 }}>
            <X size={28} color="#FFFFFF" />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export const ProfileForm: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const { profile, updateProfile } = useProfileStore(useShallow(({ profile, updateProfile }) => ({ profile, updateProfile })));
  const [form, setForm] = useState({ ...profile, phone: localPhone(profile.phone) });
  const set = (k: keyof typeof form) => (v: string | null) => setForm((f) => ({ ...f, [k]: v }));
  const ok = !!form.name.trim() && (!form.phone || form.phone.length === 10) && (!form.email || validEmail(form.email)) && form.dob !== 'partial';
  return (
    <Form
      title="Edit profile"
      onCancel={() => navigation.goBack()}
      canSave={ok}
      onSave={() => {
        updateProfile({ ...form, name: form.name.trim(), email: form.email.trim(), passportPhotoDate: form.passportPhotoUri !== profile.passportPhotoUri ? new Date().toISOString().slice(0, 10) : form.passportPhotoDate });
        if (profile.profilePhotoUri !== form.profilePhotoUri) removeFile(profile.profilePhotoUri);
        if (profile.passportPhotoUri !== form.passportPhotoUri && profile.passportPhotoUri !== profile.profilePhotoUri) removeFile(profile.passportPhotoUri);
        navigation.goBack();
      }}
    >
      <View style={{ alignItems: 'center', marginBottom: 22 }}>
        <Avatar name={form.name} uri={form.profilePhotoUri} size={104} />
        <PhotoActions uri={form.profilePhotoUri} onChange={(uri) => setForm((f) => ({ ...f, profilePhotoUri: uri, passportPhotoUri: uri }))} aspect={[7, 9]} changeLabel="Add photo" />
        <T v="caption" center style={{ marginTop: 8, paddingHorizontal: 32 }}>
          Cropped to passport size (35 × 45 mm). Share it straight to any form.
        </T>
      </View>
      <Field label="Your name" value={form.name} onChangeText={set('name')} autoCapitalize="words" maxLength={50} />
      <View style={{ marginBottom: 18 }}>
        <T v="section" style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          You are
        </T>
        <Segmented options={['Man', 'Woman', 'Other']} value={form.gender ?? ''} onChange={(v) => setForm((f) => ({ ...f, gender: v as 'Man' | 'Woman' | 'Other' }))} style={{ marginHorizontal: 16 }} />
      </View>
      <View style={{ marginBottom: 18 }}>
        <T v="section" style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          You eat
        </T>
        <Segmented options={['Veg', 'Eggs too', 'Non-veg']} value={form.diet ?? ''} onChange={(v) => setForm((f) => ({ ...f, diet: v as 'Veg' | 'Eggs too' | 'Non-veg' }))} style={{ marginHorizontal: 16 }} />
      </View>
      <Field label="Weight in kg (optional)" value={form.weightKg ? String(form.weightKg) : ''} onChangeText={(v) => setForm((f) => ({ ...f, weightKg: Number(v.replace(/\D/g, '')) || undefined }))} keyboardType="number-pad" maxLength={3} />
      <PhoneField label="Phone" value={form.phone} onChange={set('phone')} />
      <EmailField label="Email" value={form.email} onChange={set('email')} />
      <DateParts label="Date of birth" value={form.dob} onChange={set('dob')} />
    </Form>
  );
};

export const MedicalIdForm: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { profile, updateProfile } = useProfileStore(useShallow(({ profile, updateProfile }) => ({ profile, updateProfile })));
  const [form, setForm] = useState({
    bloodGroup: profile.bloodGroup,
    allergies: profile.allergies,
    emergencyContactName: profile.emergencyContactName,
    emergencyContactPhone: localPhone(profile.emergencyContactPhone),
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Form
      title="Medical ID"
      onCancel={() => navigation.goBack()}
      canSave={!form.emergencyContactPhone || form.emergencyContactPhone.length === 10}
      onSave={() => {
        updateProfile({ ...form, allergies: form.allergies.trim(), emergencyContactName: form.emergencyContactName.trim() });
        navigation.goBack();
      }}
    >
      <T v="sub" style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        Everything here is optional. Fill what you want others to see in an emergency.
      </T>
      <Pick label="Blood group" options={BLOOD_GROUPS} value={form.bloodGroup} onChange={(v) => set('bloodGroup')(v === form.bloodGroup ? '' : v)} columns={4} />
      <Field label="Allergies" value={form.allergies} onChangeText={set('allergies')} multiline maxLength={300} hint="For example: penicillin, peanuts" />
      <Field label="Emergency contact name" value={form.emergencyContactName} onChangeText={set('emergencyContactName')} autoCapitalize="words" maxLength={50} />
      <PhoneField label="Emergency contact phone" value={form.emergencyContactPhone} onChange={set('emergencyContactPhone')} />
    </Form>
  );
};

export const MedicalIdScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const { profile } = useProfileStore(useShallow(({ profile }) => ({ profile })));
  const phone = callable(profile.emergencyContactPhone);
  const line = (label: string, value: string) => (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: c.line }}>
      <T v="section">{label}</T>
      {value ? (
        <T v="h2" style={{ marginTop: 2 }}>
          {value}
        </T>
      ) : (
        <T v="body" color={c.textMuted} style={{ marginTop: 2 }}>
          Not added
        </T>
      )}
    </View>
  );
  return (
    <Screen>
      <AppBar title="Medical ID" onBack={() => navigation.goBack()} right={[{ icon: Pencil, label: 'Edit', onPress: () => navigation.navigate('MedicalIdForm') }]} />
      <T v="sub" style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        Show this screen to anyone helping you in an emergency.
      </T>
      {line('Name', profile.name)}
      {line('Blood group', profile.bloodGroup)}
      {line('Allergies', profile.allergies)}
      {line('Date of birth', /^\d{4}-\d{2}-\d{2}$/.test(profile.dob) ? new Date(`${profile.dob}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '')}
      {line('Emergency contact', [profile.emergencyContactName, showPhone(profile.emergencyContactPhone)].filter(Boolean).join(' · '))}
      <View style={{ padding: 16 }}>
        {phone ? (
          <Button title={`Call ${profile.emergencyContactName || 'emergency contact'}`} icon={Phone} variant="danger" onPress={() => Linking.openURL(`tel:${phone}`)} />
        ) : (
          <Button title="Add an emergency contact" onPress={() => navigation.navigate('MedicalIdForm')} />
        )}
      </View>
    </Screen>
  );
};

export const AppearanceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { themeMode, setThemeMode, textSize, setTextSize } = useProfileStore(useShallow(({ themeMode, setThemeMode, textSize, setTextSize }) => ({ themeMode, setThemeMode, textSize, setTextSize })));
  const themes: [ThemeMode, string][] = [
    ['system', 'Same as phone'],
    ['light', 'Light'],
    ['dark', 'Dark'],
  ];
  const sizes: [TextSize, string][] = [
    ['normal', 'Normal'],
    ['large', 'Large'],
    ['xlarge', 'Extra large'],
  ];
  return (
    <Screen>
      <AppBar title="Appearance" onBack={() => navigation.goBack()} />
      <Pick label="Theme" options={themes.map((t) => t[1])} value={themes.find((t) => t[0] === themeMode)![1]} onChange={(v) => setThemeMode(themes.find((t) => t[1] === v)![0])} />
      <Pick label="Text size" options={sizes.map((s) => s[1])} value={sizes.find((s) => s[0] === textSize)![1]} onChange={(v) => setTextSize(sizes.find((s) => s[1] === v)![0])} />
      <T v="body" style={{ paddingHorizontal: 16 }}>
        This is how text will look across Saralo.
      </T>
    </Screen>
  );
};
export const SecurityScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { vaultPin, setVaultPin, requireBiometrics, setRequireBiometrics, setPinLength, pinLength, appLock, setAppLock } = useProfileStore(useShallow(({ vaultPin, setVaultPin, requireBiometrics, setRequireBiometrics, setPinLength, pinLength, appLock, setAppLock }) => ({ vaultPin, setVaultPin, requireBiometrics, setRequireBiometrics, setPinLength, pinLength, appLock, setAppLock })));
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [msg, setMsg] = useState('');
  const [autofill, setAutofill] = useState(autofillEnabled());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => st === 'active' && setAutofill(autofillEnabled()));
    return () => sub.remove();
  }, []);
  return (
    <VaultGate onCancel={() => navigation.goBack()}>
      <Screen>
        <AppBar title="App lock and PIN" onBack={() => navigation.goBack()} />
        <Section>
          <ToggleRow title="Lock Saralo" subtitle="Ask for the PIN every time the app opens" value={appLock} onChange={setAppLock} />
          <ToggleRow title="Use fingerprint or Face ID" subtitle="Unlock without typing the PIN" value={requireBiometrics} onChange={setRequireBiometrics} last />
        </Section>
        <T v="caption" style={{ paddingHorizontal: 16, marginTop: 6 }}>
          Your private vault always needs the PIN, even when the app lock is off.
        </T>
        {autofillSupported ? (
          <Section title="Autofill">
            <Row
              icon={KeyRound}
              iconColor="#059669"
              title={autofill ? 'Saralo fills your passwords' : 'Fill and save passwords in other apps'}
              subtitle={autofill ? 'On. Tap to change it in phone settings.' : 'Tap, then pick Saralo as your autofill service'}
              chevron
              onPress={openAutofillSettings}
              last
            />
            <T v="caption" style={{ paddingHorizontal: 16, marginTop: 6 }}>
              When you log in or sign up in another app, your phone asks if you want to save it to Saralo. To fill a saved password, you unlock with your phone lock first.
            </T>
          </Section>
        ) : null}
        {vaultPin ? (
          <Section title={pinLength === 6 ? 'Change PIN' : 'Switch to a 6-digit PIN'} plain>
            <Field label="Current PIN" value={current} onChangeText={setCurrent} keyboardType="number-pad" secureTextEntry maxLength={pinLength} />
            <Field label="New 6-digit PIN" value={next} onChangeText={setNext} keyboardType="number-pad" secureTextEntry maxLength={6} />
            <Field label="Re-enter new PIN" value={again} onChangeText={setAgain} keyboardType="number-pad" secureTextEntry maxLength={6} error={msg && msg !== 'PIN changed' ? msg : again.length === 6 && again !== next ? 'The two PINs do not match' : undefined} hint={msg === 'PIN changed' ? msg : undefined} />
            <Button
              title="Change PIN"
              style={{ marginHorizontal: 16 }}
              onPress={async () => {
                if (lockSecondsLeft() > 0) return setMsg(`Too many wrong tries. Wait ${lockSecondsLeft()} ${lockSecondsLeft() === 1 ? 'second' : 'seconds'}.`);
                if (!(await checkPin(current))) return setMsg('Current PIN is wrong');
                if (!/^\d{6}$/.test(next)) return setMsg('New PIN must be 6 digits');
                if (again !== next) return setMsg('The two PINs do not match');
                setVaultPin(await hashPin(next));
                setPinLength(6);
                setCurrent('');
                setNext('');
                setAgain('');
                setMsg('PIN changed');
              }}
            />
          </Section>
        ) : null}
      </Screen>
    </VaultGate>
  );
};

export const BackupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const lastBackup = useProfileStore((s) => s.lastBackup);
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [busy, setBusy] = useState<'' | 'backup' | 'restore'>('');
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const backupError = password && password.length < 6 ? 'At least 6 characters' : again && again !== password ? 'The two passwords do not match' : undefined;

  const backup = async () => {
    setBusy('backup');
    setBackupMsg(null);
    try {
      await exportBackup(password);
      setPassword('');
      setAgain('');
      setBackupMsg({ ok: true, text: 'Done. Keep the file and the password safe.' });
    } catch {
      setBackupMsg({ ok: false, text: 'The backup could not be made. Please try again.' });
    }
    setBusy('');
  };

  const restore = () =>
    confirmAction('Restore this backup?', 'Everything now on this phone will be replaced with the data in the backup file.', 'Restore', async () => {
      setBusy('restore');
      setRestoreMsg(null);
      try {
        const content = await pickBackupFile();
        if (content) {
          restoreBackup(content, restorePassword);
          setRestorePassword('');
          setRestoreMsg({ ok: true, text: 'Restored. Your data is back.' });
        }
      } catch {
        setRestoreMsg({ ok: false, text: 'Wrong password, or this is not a Saralo backup file.' });
      }
      setBusy('');
    });

  const note = (m: { ok: boolean; text: string } | null) =>
    m ? (
      <T v="sub" color={m.ok ? c.income : c.expense} style={{ paddingHorizontal: 16, marginTop: 10, fontWeight: '600' }}>
        {m.text}
      </T>
    ) : null;

  return (
    <VaultGate onCancel={() => navigation.goBack()}>
      <Screen padBottom={40}>
        <AppBar title="Backup and restore" onBack={() => navigation.goBack()} />
        <View style={{ marginHorizontal: 16, padding: 16, borderRadius: 22, backgroundColor: lastBackup ? c.incomeSoft : c.warnSoft, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <ShieldCheck size={28} color={lastBackup ? c.income : c.warn} />
          <View style={{ flex: 1 }}>
            <T v="strong">{lastBackup ? `Last backup: ${new Date(`${lastBackup}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'No backup yet'}</T>
            <T v="sub">Your data lives only on this phone. A backup keeps it safe if the phone is lost or changed.</T>
          </View>
        </View>

        <Section title="Back up">
          <View style={{ paddingTop: 16 }}>
            <T v="sub" style={{ paddingHorizontal: 16, marginBottom: 14 }}>
              1. Make a password for this backup.{'\n'}2. Tap Back up now and save the file to Google Drive, WhatsApp or email.
            </T>
            <Field label="Backup password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" maxLength={64} />
            <Field label="Type the password again" value={again} onChangeText={setAgain} secureTextEntry autoCapitalize="none" maxLength={64} error={backupError} hint="Write it down. Without it the backup cannot be opened, not even by us." />
            <Button title={busy === 'backup' ? 'Making backup…' : 'Back up now'} icon={CloudUpload} disabled={!!busy || password.length < 6 || again !== password} style={{ marginHorizontal: 16, marginBottom: 16 }} onPress={backup} />
            {note(backupMsg)}
          </View>
        </Section>

        <Section title="Restore">
          <View style={{ paddingTop: 16, paddingBottom: 16 }}>
            <T v="sub" style={{ paddingHorizontal: 16, marginBottom: 14 }}>
              Moving to a new phone? Type the backup password, then pick your Saralo backup file.
            </T>
            <Field label="Backup password" value={restorePassword} onChangeText={setRestorePassword} secureTextEntry autoCapitalize="none" maxLength={64} />
            <Button title={busy === 'restore' ? 'Restoring…' : 'Pick backup file'} variant="secondary" disabled={!!busy || !restorePassword} style={{ marginHorizontal: 16 }} onPress={restore} />
            {busy ? <ActivityIndicator color={c.accent} style={{ marginTop: 12 }} /> : null}
            {note(restoreMsg)}
          </View>
        </Section>
        <T v="caption" style={{ paddingHorizontal: 28, marginTop: 12 }}>
          Photos are not inside the backup file. Keep important photos in your gallery too.
        </T>
      </Screen>
    </VaultGate>
  );
};

export const PrivacyScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <Screen>
    <AppBar title="Privacy policy" onBack={() => navigation.goBack()} />
    <T v="caption" style={{ paddingHorizontal: 16, marginBottom: 12 }}>
      Last updated {POLICY_UPDATED}
    </T>
    {POLICY.map((part) => (
      <View key={part.title} style={{ paddingHorizontal: 16, marginBottom: 20 }}>
        <T v="strong" style={{ marginBottom: 6 }}>
          {part.title}
        </T>
        {part.lines.map((line) => (
          <T key={line} v="body" style={{ marginBottom: 6, lineHeight: 23 }}>
            {line}
          </T>
        ))}
      </View>
    ))}
  </Screen>
);
