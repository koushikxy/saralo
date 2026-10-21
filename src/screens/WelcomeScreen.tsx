import React, { useEffect, useState } from 'react';
import { View, KeyboardAvoidingView, Keyboard, LayoutAnimation, Platform, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarCheck, Wallet, Pill, Lock, Check, X } from 'lucide-react-native';
import { TouchableOpacity } from '../components/Touchable';
import { POLICY, POLICY_UPDATED } from '../core/privacy';
import { T, Field, Button, IconCircle, Segmented } from '../ui/kit';
import { useHealthStore } from '../modules/health/healthStore';
import { goalsFor } from '../core/goals';
import { SaraloLogo } from '../components/SaraloLogo';
import { useColors } from '../core/theme';
import { useProfileStore } from '../modules/profile/profileStore';

const FEATURES = [
  { icon: CalendarCheck, color: '#4F46E5', text: 'To-dos, reminders, birthdays and a shopping list' },
  { icon: Wallet, color: '#059669', text: 'Money you spend and get, bills and a budget' },
  { icon: Pill, color: '#DB2777', text: 'Medicine reminders, water and steps' },
  { icon: Lock, color: '#7C3AED', text: 'Documents and passwords, locked with a PIN' },
];

export const WelcomeScreen: React.FC = () => {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [name, setName] = useState('');
  const [typing, setTyping] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [reading, setReading] = useState(false);
  const [step, setStep] = useState<'name' | 'about'>('name');
  const [gender, setGender] = useState<'' | 'Man' | 'Woman' | 'Other'>('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<'' | 'Mostly sitting' | 'Some walking' | 'Very active'>('');
  const [diet, setDiet] = useState<'' | 'Veg' | 'Eggs too' | 'Non-veg'>('');
  const start = () => {
    if (!name.trim() || !agreed) return;
    Keyboard.dismiss();
    setStep('about');
  };
  const finish = (skip: boolean) => {
    useProfileStore.setState({ policyAccepted: POLICY_UPDATED });
    const kg = Number(weight) || undefined;
    if (!skip) useHealthStore.getState().setTargets(goalsFor(gender, activity, kg));
    updateProfile({ name: name.trim(), ...(skip ? {} : { gender, weightKg: kg, activity, diet }) });
  };



  useEffect(() => {
    const animate = (v: boolean) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setTyping(v);
    };
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => animate(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => animate(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (step === 'about') {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: 24, paddingBottom: 16 + insets.bottom }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <T v="title" style={{ paddingHorizontal: 24 }}>
            Hi {name.trim().split(' ')[0]}, a few quick questions
          </T>
          <T v="body" color={c.textMuted} style={{ paddingHorizontal: 24, marginTop: 6, marginBottom: 24 }}>
            This sets your water and calorie goals and the clothes we suggest. You can change it later.
          </T>
          <View style={{ marginBottom: 18 }}>
            <T v="section" style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              You are
            </T>
            <Segmented options={['Man', 'Woman', 'Other']} value={gender} onChange={(v) => setGender(v as 'Man' | 'Woman' | 'Other')} style={{ marginHorizontal: 16 }} />
          </View>
          <View style={{ marginBottom: 18 }}>
            <T v="section" style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              On most days you are
            </T>
            <Segmented options={['Mostly sitting', 'Some walking', 'Very active']} value={activity} onChange={(v) => setActivity(v as 'Mostly sitting' | 'Some walking' | 'Very active')} style={{ marginHorizontal: 16 }} />
          </View>
          <View style={{ marginBottom: 18 }}>
            <T v="section" style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              You eat
            </T>
            <Segmented options={['Veg', 'Eggs too', 'Non-veg']} value={diet} onChange={(v) => setDiet(v as 'Veg' | 'Eggs too' | 'Non-veg')} style={{ marginHorizontal: 16 }} />
          </View>
          <Field label="Weight in kg (optional)" value={weight} onChangeText={(v) => setWeight(v.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={3} hint="Used only for your water goal" />
          {gender || weight || activity ? (
            <View style={{ marginHorizontal: 16, padding: 14, borderRadius: 18, backgroundColor: c.card }}>
              <T v="sub">Your daily goals</T>
              <T v="strong" style={{ marginTop: 4 }}>
                {(goalsFor(gender, activity, Number(weight) || undefined).targetWaterMl / 1000).toFixed(2).replace(/0$/, '')} L water · {goalsFor(gender, activity, Number(weight) || undefined).targetCalories} kcal
              </T>
              <T v="caption" style={{ marginTop: 4 }}>
                Calories from ICMR-NIN 2020 guidance for Indian adults. Water is 35 ml per kg when you give your weight.
              </T>
            </View>
          ) : null}
        </ScrollView>
        <View style={{ paddingHorizontal: 24, gap: 10 }}>
          <Button title="Continue" onPress={() => finish(false)} disabled={!gender} />
          <Button title="Skip for now" variant="secondary" onPress={() => finish(true)} />
        </View>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior="padding">
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 16 + (typing ? 0 : insets.bottom) }}>
        <View style={{ flex: 1, justifyContent: typing ? 'flex-end' : 'center' }}>
          <SaraloLogo size={typing ? 52 : 64} />
          <T v="title" style={{ marginTop: 18 }}>
            Welcome to Saralo
          </T>
          <T v="body" color={c.textMuted} style={{ marginTop: 6, marginBottom: typing ? 8 : 28 }}>
            Your daily life in one simple app. Everything stays on your phone.
          </T>
          {typing
            ? null
            : FEATURES.map((f) => (
                <View key={f.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <IconCircle icon={f.icon} color={f.color} />
                  <T v="body" style={{ flex: 1 }}>
                    {f.text}
                  </T>
                </View>
              ))}
        </View>
        <View style={{ marginHorizontal: -16, marginTop: 16 }}>
          <Field label="What should we call you?" value={name} onChangeText={setName} autoCapitalize="words" maxLength={40} returnKeyType="done" onSubmitEditing={start} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => setAgreed(!agreed)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            accessibilityLabel="I agree to the privacy policy"
            style={{ width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: agreed ? c.accent : c.textFaint, backgroundColor: agreed ? c.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}
          >
            {agreed ? <Check size={18} color="#FFFFFF" strokeWidth={3} /> : null}
          </TouchableOpacity>
          <T v="sub" style={{ flex: 1 }}>
            I have read and agree to the Privacy policy
          </T>
          <TouchableOpacity onPress={() => setReading(true)} accessibilityLabel="Read the privacy policy" style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <T v="sub" color={c.accent} style={{ fontWeight: '700' }}>
              Read
            </T>
          </TouchableOpacity>
        </View>
        <Button title="Get started" onPress={start} disabled={!name.trim() || !agreed} />
        <Modal visible={reading} animationType="slide" onRequestClose={() => setReading(false)}>
          <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
              <T v="h2" style={{ flex: 1 }}>
                Privacy policy
              </T>
              <TouchableOpacity onPress={() => setReading(false)} accessibilityLabel="Close" style={{ padding: 8 }}>
                <X size={24} color={c.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
              <T v="caption" style={{ marginBottom: 12 }}>
                Last updated {POLICY_UPDATED}
              </T>
              {POLICY.map((part) => (
                <View key={part.title} style={{ marginBottom: 18 }}>
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
            </ScrollView>
            <View style={{ padding: 16, paddingBottom: 16 + insets.bottom }}>
              <Button title="I agree" onPress={() => { setAgreed(true); setReading(false); }} />
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};
