import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarCheck, Wallet, Pill, Lock } from 'lucide-react-native';
import { T, Field, Button, IconCircle } from '../ui/kit';
import { SaraloLogo } from '../components/SaraloLogo';
import { useColors } from '../core/theme';
import { useProfileStore } from '../modules/profile/profileStore';

const FEATURES = [
  { icon: CalendarCheck, color: '#4F46E5', text: 'To-dos, reminders, birthdays and a shopping list' },
  { icon: Wallet, color: '#059669', text: 'Money you spend and get, bills and a budget' },
  { icon: Pill, color: '#DB2777', text: 'Medicine reminders, water, steps and sleep' },
  { icon: Lock, color: '#7C3AED', text: 'Documents and passwords, locked with a PIN' },
];

export const WelcomeScreen: React.FC = () => {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [name, setName] = useState('');
  const start = () => name.trim() && updateProfile({ name: name.trim() });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior="padding">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 + insets.top, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <SaraloLogo size={64} />
        <T v="title" style={{ marginTop: 20 }}>
          Welcome to Saralo
        </T>
        <T v="body" color={c.textMuted} style={{ marginTop: 6, marginBottom: 24 }}>
          Your daily life in one simple app. Everything stays on your phone.
        </T>
        {FEATURES.map((f) => (
          <View key={f.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <IconCircle icon={f.icon} color={f.color} />
            <T v="body" style={{ flex: 1 }}>
              {f.text}
            </T>
          </View>
        ))}
        <View style={{ marginTop: 18, marginHorizontal: -16 }}>
          <Field label="What should we call you?" value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="done" onSubmitEditing={start} />
        </View>
        <Button title="Get started" onPress={start} disabled={!name.trim()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
