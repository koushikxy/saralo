import React, { useState } from 'react';
import { View, Image, Linking, ActivityIndicator } from 'react-native';
import {
  HeartPulse,
  Phone,
  Landmark,
  QrCode,
  Target,
  Receipt,
  Shirt,
  Cake,
  Sun,
  Type,
  Lock,
  CloudUpload,
  ShieldCheck,
  Trash2,
  Camera,
  Dumbbell,
  Pencil,
} from 'lucide-react-native';
import { Screen, AppBar, Section, Row, Avatar, T, Form, Field, Pick, Button, ToggleRow, DateField } from '../ui/kit';
import { useColors } from '../core/theme';
import { confirmAction } from '../core/confirm';
import { hashPin, checkPin, lockSecondsLeft } from '../core/security/pin';
import { MediaPickerService } from '../core/storage/mediaPickerService';
import { exportBackup, pickBackupFile, restoreBackup, wipeAllData } from '../core/storage/backup';
import { useProfileStore, ThemeMode, TextSize } from '../modules/profile/profileStore';
import { VAULT_INFO, VaultKind } from './vault/VaultScreens';


export const MoreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const { profile } = useProfileStore();
  const photo = profile.profilePhotoUri || profile.passportPhotoUri;
  const call = () => {
    const n = profile.emergencyContactPhone.replace(/[^0-9+]/g, '');
    if (n) Linking.openURL(`tel:${n}`);
    else navigation.navigate('ProfileForm');
  };

  return (
    <Screen>
      <AppBar title="More" />
      <Row
        leading={photo ? <Image source={{ uri: photo }} style={{ width: 60, height: 60, borderRadius: 30 }} /> : <Avatar name={profile.name} size={60} />}
        title={profile.name || 'Your name'}
        subtitle="Edit your profile"
        chevron
        onPress={() => navigation.navigate('ProfileForm')}
        last
      />

      <Section title="Private (locked with your PIN)">
        {(Object.keys(VAULT_INFO) as VaultKind[]).map((k, i, arr) => (
          <Row key={k} icon={VAULT_INFO[k].icon} iconColor={VAULT_INFO[k].color} title={VAULT_INFO[k].title} chevron onPress={() => navigation.navigate('VaultList', { type: k })} last={i === arr.length - 1} />
        ))}
      </Section>

      <Section title="Safety">
        <Row icon={HeartPulse} iconColor="#DC2626" title="Medical ID" subtitle={profile.bloodGroup ? `Blood group ${profile.bloodGroup}` : 'Blood group, allergies, emergency contact'} chevron onPress={() => navigation.navigate('MedicalId')} />
        <Row
          icon={Phone}
          iconColor="#DC2626"
          title={profile.emergencyContactPhone ? `Call ${profile.emergencyContactName || 'emergency contact'}` : 'Add an emergency contact'}
          subtitle={profile.emergencyContactPhone || 'One tap to call in an emergency'}
          onPress={call}
          last
        />
      </Section>

      <Section title="Money">
        <Row icon={Receipt} iconColor="#CA8A04" title="Monthly bills" chevron onPress={() => navigation.navigate('Bills')} />
        <Row icon={Target} iconColor="#4F46E5" title="Budget" chevron onPress={() => navigation.navigate('BudgetForm')} />
        <Row icon={QrCode} iconColor="#0F172A" title="My UPI QR" chevron onPress={() => navigation.navigate('Upi')} />
        <Row icon={Landmark} iconColor="#0891B2" title="Banks and cards" chevron onPress={() => navigation.navigate('Accounts')} last />
      </Section>

      <Section title="Lifestyle">
        <Row icon={Dumbbell} iconColor="#2563EB" title="Gym and workouts" chevron onPress={() => navigation.navigate('Gym')} />
        <Row icon={Shirt} iconColor="#7C3AED" title="Outfits and closet" chevron onPress={() => navigation.navigate('Outfits')} />
        <Row icon={Cake} iconColor="#C026D3" title="Birthdays and anniversaries" chevron onPress={() => navigation.navigate('Planner', { tab: 'Special days' })} last />
      </Section>

      <Section title="App">
        <Row icon={Sun} iconColor="#F59E0B" title="Appearance and text size" chevron onPress={() => navigation.navigate('Appearance')} />
        <Row icon={Lock} iconColor="#4F46E5" title="PIN and lock" chevron onPress={() => navigation.navigate('Security')} />
        <Row icon={CloudUpload} iconColor="#0284C7" title="Backup and restore" chevron onPress={() => navigation.navigate('Backup')} />
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

export const ProfileForm: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { profile, updateProfile, setProfilePhoto } = useProfileStore();
  const [form, setForm] = useState({ ...profile });
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });
  const photo = form.profilePhotoUri || form.passportPhotoUri;
  return (
    <Form
      title="Edit profile"
      onCancel={() => navigation.goBack()}
      canSave={!!form.name.trim()}
      onSave={() => {
        updateProfile({ ...form, name: form.name.trim() });
        if (form.profilePhotoUri !== profile.profilePhotoUri) setProfilePhoto(form.profilePhotoUri);
        navigation.goBack();
      }}
    >
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        {photo ? <Image source={{ uri: photo }} style={{ width: 96, height: 96, borderRadius: 48 }} /> : <Avatar name={form.name} size={96} />}
        <Button
          title="Change photo"
          icon={Camera}
          variant="secondary"
          style={{ marginTop: 10, height: 44 }}
          onPress={async () => {
            const uri = await MediaPickerService.pickFromGallery();
            if (uri) setForm({ ...form, profilePhotoUri: uri });
          }}
        />
      </View>
      <Field label="Your name" value={form.name} onChangeText={set('name')} />
      <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Field label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
      <DateField label="Date of birth" value={form.dob} onChange={set('dob')} start="1990-01-01" past />
      <Pick label="Blood group" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} value={form.bloodGroup} onChange={set('bloodGroup')} />
      <Field label="Allergies (optional)" value={form.allergies} onChangeText={set('allergies')} />
      <Field label="Emergency contact name" value={form.emergencyContactName} onChangeText={set('emergencyContactName')} />
      <Field label="Emergency contact phone" value={form.emergencyContactPhone} onChangeText={set('emergencyContactPhone')} keyboardType="phone-pad" />
    </Form>
  );
};

export const MedicalIdScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const { profile } = useProfileStore();
  const phone = profile.emergencyContactPhone.replace(/[^0-9+]/g, '');
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
      <AppBar title="Medical ID" onBack={() => navigation.goBack()} right={[{ icon: Pencil, label: 'Edit', onPress: () => navigation.navigate('ProfileForm') }]} />
      <T v="sub" style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        Show this screen to anyone helping you in an emergency.
      </T>
      {line('Name', profile.name)}
      {line('Blood group', profile.bloodGroup)}
      {line('Allergies', profile.allergies)}
      {line('Date of birth', /^\d{4}-\d{2}-\d{2}$/.test(profile.dob) ? new Date(`${profile.dob}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : profile.dob)}
      {line('Emergency contact', [profile.emergencyContactName, profile.emergencyContactPhone].filter(Boolean).join(' · '))}
      <View style={{ padding: 16 }}>
        {phone ? (
          <Button title={`Call ${profile.emergencyContactName || 'emergency contact'}`} icon={Phone} variant="danger" onPress={() => Linking.openURL(`tel:${phone}`)} />
        ) : (
          <Button title="Add an emergency contact" onPress={() => navigation.navigate('ProfileForm')} />
        )}
      </View>
    </Screen>
  );
};

export const AppearanceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { themeMode, setThemeMode, textSize, setTextSize } = useProfileStore();
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
  const { vaultPin, setVaultPin, requireBiometrics, setRequireBiometrics } = useProfileStore();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');
  return (
    <Screen>
      <AppBar title="PIN and lock" onBack={() => navigation.goBack()} />
      <Section>
        <ToggleRow title="Use fingerprint or Face ID" subtitle="Unlock your private vault without typing the PIN" value={requireBiometrics} onChange={setRequireBiometrics} last />
      </Section>
      <Section title={vaultPin ? 'Change PIN' : 'You will create a PIN the first time you open a private section'}>
        {vaultPin ? (
          <>
            <Field label="Current PIN" value={current} onChangeText={setCurrent} keyboardType="number-pad" secureTextEntry maxLength={4} />
            <Field label="New 4-digit PIN" value={next} onChangeText={setNext} keyboardType="number-pad" secureTextEntry maxLength={4} error={msg && msg !== 'PIN changed' ? msg : undefined} hint={msg === 'PIN changed' ? msg : undefined} />
            <Button
              title="Change PIN"
              style={{ marginHorizontal: 16 }}
              onPress={async () => {
                if (lockSecondsLeft() > 0) return setMsg(`Too many wrong tries. Wait ${lockSecondsLeft()} seconds.`);
                if (!(await checkPin(current))) return setMsg('Current PIN is wrong');
                if (!/^\d{4}$/.test(next)) return setMsg('New PIN must be 4 digits');
                setVaultPin(await hashPin(next));
                setCurrent('');
                setNext('');
                setMsg('PIN changed');
              }}
            />
          </>
        ) : null}
      </Section>
    </Screen>
  );
};

export const BackupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const c = useColors();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const run = async (task: () => Promise<string | null>) => {
    if (password.length < 6) return setMsg('Use a password with at least 6 characters.');
    setBusy(true);
    setMsg('');
    try {
      const m = await task();
      if (m) setMsg(m);
    } catch {
      setMsg('That did not work. Check the password and pick a Saralo backup file.');
    }
    setBusy(false);
  };
  return (
    <Screen>
      <AppBar title="Backup and restore" onBack={() => navigation.goBack()} />
      <T v="body" style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        Your data is only on this phone. Make a backup file and keep it in Google Drive or email, so you can move to a new phone.
      </T>
      <Field label="Backup password" value={password} onChangeText={setPassword} secureTextEntry hint="You need this password to restore. It cannot be recovered." />
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <Button title="Create backup file" icon={CloudUpload} disabled={busy} onPress={() => run(async () => (await exportBackup(password), 'Backup created. Save it somewhere safe.'))} />
        <Button
          title="Restore from a file"
          variant="secondary"
          disabled={busy}
          onPress={() =>
            run(async () => {
              const content = await pickBackupFile();
              if (!content) return null;
              restoreBackup(content, password);
              return 'Restored. Your data is back.';
            })
          }
        />
        {busy ? <ActivityIndicator color={c.accent} /> : null}
        {msg ? <T v="sub">{msg}</T> : null}
        <T v="caption">Photos are not inside the backup. Keep them in your gallery.</T>
      </View>
    </Screen>
  );
};

export const PrivacyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const part = (title: string, body: string) => (
    <View key={title} style={{ paddingHorizontal: 16, marginBottom: 18 }}>
      <T v="strong" style={{ marginBottom: 4 }}>
        {title}
      </T>
      <T v="body">{body}</T>
    </View>
  );
  return (
    <Screen>
      <AppBar title="Privacy policy" onBack={() => navigation.goBack()} />
      {part('The short version', 'Saralo has no account and no server. Everything you add stays on your phone, encrypted. We cannot see it and we never sell or share anything.')}
      {part('What is stored', 'Your planner, money entries, health logs, medicines, closet, vault items and settings. Only on this device.')}
      {part('Services the app talks to', 'Open-Meteo gets your approximate location or the city you type, to show the weather. If you do not allow location, ipapi.co guesses your city from your internet address. Nothing else leaves your phone.')}
      {part('Permissions', 'Camera and photos to add pictures. Location for the weather. Motion to count steps. Notifications for reminders. Fingerprint or Face ID to unlock the vault. Each is asked only when you use that feature.')}
      {part('Backups', 'Backup files are made by you and locked with your password. You choose where to keep them.')}
      {part('Deleting your data', 'More → Delete all my data removes everything. Uninstalling the app does the same.')}
      {part('Children', 'Saralo is not made for children under 13.')}
    </Screen>
  );
};
