import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { Delete, Fingerprint, Lock } from 'lucide-react-native';
import { T } from '../../ui/kit';
import { TouchableOpacity } from '../../components/Touchable';
import { useColors, useTextScale } from '../../core/theme';
import { useProfileStore } from '../../modules/profile/profileStore';
import { hashPin, checkPin, lockSecondsLeft } from '../../core/security/pin';

export const useVaultSession = create<{ unlocked: boolean; set: (v: boolean) => void }>((set) => ({
  unlocked: false,
  set: (v) => set({ unlocked: v }),
}));

export const VaultGate: React.FC<{ children: React.ReactNode; onCancel?: () => void }> = ({ children, onCancel }) => {
  const c = useColors();
  const scale = useTextScale();
  const { vaultPin, setVaultPin, requireBiometrics } = useProfileStore();
  const { unlocked, set } = useVaultSession();
  const [entry, setEntry] = useState('');
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  const creating = !vaultPin;

  const tryBiometric = async () => {
    if (creating || !requireBiometrics) return;
    try {
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      if (level === LocalAuthentication.SecurityLevel.NONE) return;
      const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock your private vault', cancelLabel: 'Use Saralo PIN', disableDeviceFallback: true });
      if (res.success) set(true);
    } catch {}
  };

  useEffect(() => {
    if (!unlocked) tryBiometric();
  }, [unlocked]);

  const press = (d: string) => {
    if (entry.length >= 4) return;
    const next = entry + d;
    setEntry(next);
    setError('');
    if (next.length < 4) return;
    setTimeout(async () => {
      setEntry('');
      if (creating) {
        if (draft === null) return setDraft(next);
        if (draft === next) {
          setVaultPin(await hashPin(next));
          set(true);
        } else {
          setDraft(null);
          setError('The two PINs did not match. Try again.');
        }
        return;
      }
      if (lockSecondsLeft() > 0) return setError(`Too many wrong tries. Wait ${lockSecondsLeft()} seconds.`);
      if (await checkPin(next)) set(true);
      else {
        const wait = lockSecondsLeft();
        setError(wait > 0 ? `Too many wrong tries. Wait ${wait} seconds.` : 'Wrong PIN. Try again.');
      }
    }, 120);
  };

  usePreventScreenCapture();

  if (unlocked) return <>{children}</>;

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {onCancel ? (
        <TouchableOpacity onPress={onCancel} accessibilityLabel="Cancel" style={{ position: 'absolute', top: 12, left: 8, padding: 12 }}>
          <T v="body" color={c.accent}>
            Cancel
          </T>
        </TouchableOpacity>
      ) : null}
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Lock size={28} color={c.accent} />
      </View>
      <T v="h2" center>
        {creating ? (draft === null ? 'Create a 4-digit PIN' : 'Enter the same PIN again') : 'Enter your PIN'}
      </T>
      <T v="sub" center style={{ marginTop: 6 }}>
        {creating ? 'This PIN keeps your private things safe.' : 'Your private vault is locked.'}
      </T>
      <View style={{ flexDirection: 'row', gap: 18, marginVertical: 28 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: i < entry.length ? c.accent : c.line }} />
        ))}
      </View>
      {error ? (
        <T v="sub" color={c.expense} style={{ marginBottom: 12 }}>
          {error}
        </T>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'space-between', rowGap: 16 }}>
        {keys.map((k) => {
          if (k === 'bio') {
            return !creating && requireBiometrics ? (
              <TouchableOpacity key={k} onPress={tryBiometric} accessibilityLabel="Use fingerprint or face" style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>
                <Fingerprint size={30} color={c.accent} />
              </TouchableOpacity>
            ) : (
              <View key={k} style={{ width: 80, height: 80 }} />
            );
          }
          if (k === 'del') {
            return (
              <TouchableOpacity key={k} onPress={() => setEntry(entry.slice(0, -1))} accessibilityLabel="Delete digit" style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>
                <Delete size={28} color={c.ink} />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity key={k} onPress={() => press(k)} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 30 * scale, fontWeight: '600', color: c.ink }}>{k}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
