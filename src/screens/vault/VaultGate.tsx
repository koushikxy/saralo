import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { Delete, Fingerprint, Lock } from 'lucide-react-native';
import { T } from '../../ui/kit';
import { TouchableOpacity } from '../../components/Touchable';
import { useColors, useTextScale } from '../../core/theme';
import { useProfileStore } from '../../modules/profile/profileStore';
import { hashPin, checkPin, lockSecondsLeft } from '../../core/security/pin';

const IDLE_LOCK_MS = 60000;

export const useVaultSession = create<{ unlocked: boolean; lastUse: number; picking: boolean; set: (v: boolean) => void; touch: () => void; setPicking: (v: boolean) => void }>((set) => ({
  unlocked: false,
  lastUse: 0,
  picking: false,
  set: (v) => set({ unlocked: v, lastUse: Date.now() }),
  touch: () => set({ lastUse: Date.now() }),
  setPicking: (v) => set({ picking: v, lastUse: Date.now() }),
}));

export const VaultGate: React.FC<{ children: React.ReactNode; onCancel?: () => void }> = ({ children, onCancel }) => {
  const c = useColors();
  const scale = useTextScale();
  const { vaultPin, setVaultPin, requireBiometrics, pinLength, setPinLength } = useProfileStore();
  const { unlocked, set } = useVaultSession();
  const [entry, setEntry] = useState('');
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  const creating = !vaultPin;
  const [newLength, setNewLength] = useState(6);
  const seen = useRef(false);
  const size = creating ? newLength : pinLength;

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
    if (entry.length >= size) return;
    const next = entry + d;
    setEntry(next);
    setError('');
    if (next.length < size) return;
    setTimeout(async () => {
      setEntry('');
      if (creating) {
        if (draft === null) return setDraft(next);
        if (draft === next) {
          setVaultPin(await hashPin(next));
          setPinLength(next.length);
          set(true);
        } else {
          setDraft(null);
          setError('The two PINs did not match. Try again.');
        }
        return;
      }
      if (lockSecondsLeft() > 0) return setError(`Too many wrong tries. Wait ${lockSecondsLeft()} ${lockSecondsLeft() === 1 ? 'second' : 'seconds'}.`);
      if (await checkPin(next)) set(true);
      else {
        const wait = lockSecondsLeft();
        setError(wait > 0 ? `Too many wrong tries. Wait ${wait} ${wait === 1 ? 'second' : 'seconds'}.` : 'Wrong PIN. Try again.');
      }
    }, 120);
  };

  usePreventScreenCapture();

  useEffect(() => {
    if (!unlocked) return;
    const timer = setInterval(() => {
      const v = useVaultSession.getState();
      if (!v.picking && Date.now() - v.lastUse > IDLE_LOCK_MS) set(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [unlocked]);

  if (unlocked) seen.current = true;
  if (unlocked)
    return (
      <View style={{ flex: 1 }} onTouchStart={() => useVaultSession.getState().touch()}>
        {children}
      </View>
    );

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];
  const lockScreen = (
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
        {creating ? (draft === null ? `Create a ${newLength}-digit PIN` : 'Enter the same PIN again') : 'Enter your PIN'}
      </T>
      <T v="sub" center style={{ marginTop: 6 }}>
        {creating ? 'This PIN keeps your private things safe.' : 'Your private vault is locked.'}
      </T>
      <View style={{ flexDirection: 'row', gap: 18, marginVertical: 28 }}>
        {Array.from({ length: size }, (_, i) => i).map((i) => (
          <View key={i} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: i < entry.length ? c.accent : c.line }} />
        ))}
      </View>
      {creating && draft === null && entry.length === 0 ? (
        <TouchableOpacity onPress={() => setNewLength(newLength === 6 ? 4 : 6)} style={{ marginTop: -14, marginBottom: 14, padding: 8 }}>
          <T v="sub" color={c.accent}>
            {newLength === 6 ? 'Use a 4-digit PIN instead' : 'Use a safer 6-digit PIN'}
          </T>
        </TouchableOpacity>
      ) : null}
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
  if (!seen.current) return lockScreen;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {children}
      </View>
      <View style={StyleSheet.absoluteFill}>{lockScreen}</View>
    </View>
  );
};
