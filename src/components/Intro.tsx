import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SaraloLogo, SaraloWordmark } from './SaraloLogo';
import { useColors } from '../core/theme';

export const Intro: React.FC<{ ready: boolean; onDone: () => void }> = ({ ready, onDone }) => {
  const c = useColors();
  const logo = useRef(new Animated.Value(1)).current;
  const word = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
    Animated.sequence([
      Animated.timing(logo, { toValue: 0.86, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(logo, { toValue: 1.06, speed: 14, bounciness: 14, useNativeDriver: true }),
        Animated.timing(word, { toValue: 1, duration: 260, delay: 80, useNativeDriver: true }),
      ]),
      Animated.delay(220),
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(logo, { toValue: 1.5, duration: 260, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, [ready]);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', opacity: fade, zIndex: 10 }]}>
      <Animated.View style={{ transform: [{ scale: logo }] }}>
        <SaraloLogo size={96} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', top: '58%', opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        <SaraloWordmark color={c.ink} size={34} />
      </Animated.View>
    </Animated.View>
  );
};
