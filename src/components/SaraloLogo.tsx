import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';

export const SaraloLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 1024 1024">
    <Rect width="1024" height="1024" rx="230" fill="#0F766E" />
    <Rect x="290" y="262" width="444" height="120" rx="60" fill="#FFFFFF" />
    <Rect x="290" y="452" width="444" height="120" rx="60" fill="#99F6E4" />
    <Rect x="290" y="642" width="300" height="120" rx="60" fill="#FFFFFF" />
    <Circle cx="680" cy="702" r="60" fill="#FBBF24" />
  </Svg>
);

export const SaraloWordmark: React.FC<{ size?: number; color: string }> = ({ size = 38, color }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} accessibilityRole="header" accessibilityLabel="Saralo">
    <Text style={{ fontFamily: 'GrandHotel_400Regular', fontSize: size, lineHeight: size * 1.25, color, includeFontPadding: false }}>Saralo</Text>
    <View style={{ width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: '#FBBF24', marginTop: size * 0.22, marginLeft: 1 }} />
  </View>
);
