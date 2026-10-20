import React, { useRef } from 'react';
import { Animated, Platform, Pressable, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const native = Platform.OS !== 'web';

export const TouchableOpacity: React.FC<TouchableOpacityProps> = ({
  style,
  activeOpacity = 0.85,
  hitSlop = 6,
  onPress,
  children,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const still = activeOpacity >= 1;
  const animate = (to: number, fade: number) =>
    !still &&
    Animated.parallel([
      Animated.spring(scale, { toValue: to, useNativeDriver: native, speed: 40, bounciness: 0 }),
      Animated.timing(opacity, { toValue: fade, duration: 90, useNativeDriver: native }),
    ]).start();

  return (
    <AnimatedPressable
      accessibilityRole={native ? 'button' : undefined}
      {...rest}
      hitSlop={hitSlop}
      onPressIn={(e) => {
        animate(0.97, activeOpacity);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animate(1, 1);
        rest.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (native && !still) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={[style as object, { opacity, transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
};
