import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useFonts, GrandHotel_400Regular } from '@expo-google-fonts/grand-hotel';
import { Sun, CalendarCheck, Wallet, HeartPulse, Menu } from 'lucide-react-native';

import { useColors, useStyles, useTextScale, Palette } from './src/core/theme';
import { useAppBoot } from './src/core/useAppBoot';
import { useProfileStore } from './src/modules/profile/profileStore';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { PlannerScreen } from './src/screens/PlannerScreen';
import { MoneyScreen } from './src/screens/MoneyScreen';
import { HealthScreen } from './src/screens/HealthScreen';
import { MoreScreen, ProfileForm, MedicalIdScreen, AppearanceScreen, SecurityScreen, BackupScreen, PrivacyScreen } from './src/screens/MoreScreen';
import { OutfitsScreen, ClothForm } from './src/screens/OutfitsScreen';
import { BillsScreen } from './src/screens/money/BillsScreen';
import { VaultListScreen, VaultFormScreen } from './src/screens/vault/VaultScreens';
import { TodoForm, ReminderForm, EventForm } from './src/screens/forms/PlannerForms';
import { MedicineForm, BillForm, SpecialDayForm } from './src/screens/forms/LifeForms';
import { TransactionForm, BudgetForm, UpiScreen, AccountsScreen, AccountForm } from './src/screens/forms/MoneyForms';
import { MealForm, ActivityForm, GoalsForm } from './src/screens/forms/HealthForms';

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
  ClothForm,
  VaultForm: VaultFormScreen,
};

const PAGES = {
  Bills: BillsScreen,
  Upi: UpiScreen,
  Accounts: AccountsScreen,
  Outfits: OutfitsScreen,
  VaultList: VaultListScreen,
  MedicalId: MedicalIdScreen,
  Appearance: AppearanceScreen,
  Security: SecurityScreen,
  Backup: BackupScreen,
  Privacy: PrivacyScreen,
};

function MainTabs() {
  const c = useColors();
  const scale = useTextScale();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: () => {
          if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, { height: 64 + bottom, paddingBottom: bottom }],
      }}
    >
      {TABS.map(({ name, component, icon: I }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarAccessibilityLabel: name,
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItem}>
                <View style={[styles.tabPill, focused && { backgroundColor: c.accentSoft }]}>
                  <I size={24} color={focused ? c.accent : c.textMuted} strokeWidth={focused ? 2.4 : 1.9} />
                </View>
                <Text style={[styles.tabLabel, { fontSize: 12 * Math.min(scale, 1.15) }, focused && { color: c.ink, fontWeight: '700' }]} numberOfLines={1}>
                  {name}
                </Text>
              </View>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  const booted = useAppBoot();
  const [fontsLoaded, fontError] = useFonts({ GrandHotel_400Regular });
  const ready = booted && (fontsLoaded || !!fontError);
  const c = useColors();
  const hasName = useProfileStore((s) => !!s.profile.name.trim());

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
        <StatusBar style={c.dark ? 'light' : 'dark'} />
        {!ready ? null : !hasName ? (
          <WelcomeScreen />
        ) : (
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    tabBar: { backgroundColor: c.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, paddingTop: 6, elevation: 0 },
    tabItem: { alignItems: 'center', justifyContent: 'center', width: 72, gap: 2 },
    tabPill: { width: 60, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    tabLabel: { fontWeight: '500', color: c.textMuted },
  });
