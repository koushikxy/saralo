import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text, Animated, Pressable } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { useFonts, GrandHotel_400Regular } from '@expo-google-fonts/grand-hotel';
import { Sun, CalendarCheck, Wallet, HeartPulse, Menu } from 'lucide-react-native';

import { useColors, useStyles, useTextScale, Palette } from './src/core/theme';
import { useAppBoot } from './src/core/useAppBoot';
import { useProfileStore } from './src/modules/profile/profileStore';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { PlannerScreen, RemindersScreen, ShoppingScreen, SpecialDaysScreen } from './src/screens/PlannerScreen';
import { MoneyScreen } from './src/screens/MoneyScreen';
import { HealthScreen } from './src/screens/HealthScreen';
import { MoreScreen, ProfileScreen, ProfileForm, MedicalIdForm, MedicalIdScreen, AppearanceScreen, SecurityScreen, BackupScreen, PrivacyScreen } from './src/screens/MoreScreen';
import { OutfitsScreen, ClothForm, ClothItemScreen } from './src/screens/OutfitsScreen';
import { BillsScreen } from './src/screens/money/BillsScreen';
import { GymScreen, WorkoutForm, LiftHistoryScreen } from './src/screens/GymScreens';
import { VaultListScreen, VaultFormScreen, VaultItemScreen } from './src/screens/vault/VaultScreens';
import { LockPad } from './src/screens/vault/VaultGate';
import { useVaultSession } from './src/core/security/session';
import { Intro } from './src/components/Intro';
import { TodoForm, ReminderForm, EventForm } from './src/screens/forms/PlannerForms';
import { MedicineForm, BillForm, SpecialDayForm } from './src/screens/forms/LifeForms';
import { TransactionForm, BudgetForm, UpiScreen, AccountsScreen, AccountForm } from './src/screens/forms/MoneyForms';
import { MealForm, ActivityForm, GoalsForm } from './src/screens/forms/HealthForms';

SplashScreen.preventAutoHideAsync().catch(() => {});
if (Constants.executionEnvironment !== 'storeClient') SplashScreen.setOptions({ duration: 200, fade: true });

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TABS = [
  { name: 'Today', component: TodayScreen, icon: Sun },
  { name: 'Planner', component: PlannerScreen, icon: CalendarCheck },
  { name: 'Money', component: MoneyScreen, icon: Wallet },
  { name: 'Health', component: HealthScreen, icon: HeartPulse },
  { name: 'More', component: MoreScreen, icon: Menu },
];

const FORMS = {
  TodoForm,
  ReminderForm,
  EventForm,
  MedicineForm,
  BillForm,
  SpecialDayForm,
  TransactionForm,
  BudgetForm,
  AccountForm,
  MealForm,
  ActivityForm,
  GoalsForm,
  ProfileForm,
  MedicalIdForm,
  ClothForm,
  WorkoutForm,
  VaultForm: VaultFormScreen,
};

const PAGES = {
  Bills: BillsScreen,
  RemindersList: RemindersScreen,
  ShoppingList: ShoppingScreen,
  SpecialDaysList: SpecialDaysScreen,
  Upi: UpiScreen,
  Accounts: AccountsScreen,
  Outfits: OutfitsScreen,
  ClothItem: ClothItemScreen,
  Gym: GymScreen,
  LiftHistory: LiftHistoryScreen,
  VaultList: VaultListScreen,
  VaultItem: VaultItemScreen,
  Profile: ProfileScreen,
  MedicalId: MedicalIdScreen,
  Appearance: AppearanceScreen,
  Security: SecurityScreen,
  Backup: BackupScreen,
  Privacy: PrivacyScreen,
};

const TabButton: React.FC<{ name: string; icon: (typeof TABS)[number]['icon']; focused: boolean; onPress: () => void }> = ({ name, icon: I, focused, onPress }) => {
  const c = useColors();
  const scale = useTextScale();
  const styles = useStyles(makeStyles);
  const on = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(on, { toValue: focused ? 1 : 0, speed: 16, bounciness: 6, useNativeDriver: true }).start();
  }, [focused]);

  const press = () => {
    Animated.sequence([
      Animated.timing(pop, { toValue: 0.82, duration: 70, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, speed: 20, bounciness: 14, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={press} style={styles.tabItem} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={name}>
      <View style={styles.tabPillBox}>
        <Animated.View style={[styles.tabPill, { opacity: on, transform: [{ scaleX: on.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }]} />
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <I size={24} color={focused ? c.accent : c.textMuted} strokeWidth={focused ? 2.4 : 1.9} />
        </Animated.View>
      </View>
      <Text style={[styles.tabLabel, { fontSize: 12 * Math.min(scale, 1.15) }, focused && { color: c.ink, fontWeight: '700' }]} numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
};

function TabBar({ state, navigation }: BottomTabBarProps) {
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: 10 + insets.bottom }]}>
      {state.routes.map((route, i) => {
        const tab = TABS.find((t) => t.name === route.name)!;
        const focused = state.index === i;
        return (
          <TabButton
            key={route.key}
            name={route.name}
            icon={tab.icon}
            focused={focused}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
          />
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenListeners={{
        tabPress: () => {
          if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
        },
      }}
      screenOptions={{ headerShown: false, freezeOnBlur: true }}
    >
      {TABS.map(({ name, component }) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  const booted = useAppBoot();
  const [fontsLoaded, fontError] = useFonts({ GrandHotel_400Regular });
  const ready = booted && (fontsLoaded || !!fontError);
  const [intro, setIntro] = useState(true);
  const c = useColors();
  const hasName = useProfileStore((s) => !!s.profile.name.trim());
  const appLock = useProfileStore((s) => s.appLock);
  const appUnlocked = useVaultSession((s) => s.appUnlocked);
  const unlockApp = useVaultSession((s) => s.unlockApp);
  const locked = hasName && appLock && !appUnlocked;
  const opened = useRef(false);
  if (ready && hasName && !locked) opened.current = true;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
        <StatusBar style={c.dark ? 'light' : 'dark'} />
        {!ready ? null : !hasName ? (
          <WelcomeScreen />
        ) : !opened.current ? null : (
          <NavigationContainer
            theme={{
              ...(c.dark ? DarkTheme : DefaultTheme),
              colors: { ...(c.dark ? DarkTheme : DefaultTheme).colors, background: c.bg, card: c.card, primary: c.accent, border: c.line, text: c.ink },
            }}
          >
            <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
              <Stack.Screen name="Main" component={MainTabs} />
              {Object.entries(PAGES).map(([name, component]) => (
                <Stack.Screen key={name} name={name} component={component as any} options={{ animation: 'slide_from_right' }} />
              ))}
              {Object.entries(FORMS).map(([name, component]) => (
                <Stack.Screen key={name} name={name} component={component as any} options={{ presentation: Platform.OS === 'ios' ? 'modal' : 'card', animation: 'slide_from_bottom' }} />
              ))}
            </Stack.Navigator>
          </NavigationContainer>
        )}
        {ready && locked ? (
          <View style={StyleSheet.absoluteFill}>
            <LockPad onUnlock={unlockApp} />
          </View>
        ) : null}
        {intro ? <Intro ready={ready} onDone={() => setIntro(false)} /> : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    tabBar: { flexDirection: 'row', backgroundColor: c.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, paddingTop: 10 },
    tabItem: { flex: 1, alignItems: 'center', gap: 4 },
    tabPillBox: { width: 64, height: 32, alignItems: 'center', justifyContent: 'center' },
    tabPill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, backgroundColor: c.accentSoft },
    tabLabel: { fontWeight: '500', color: c.textMuted },
  });
