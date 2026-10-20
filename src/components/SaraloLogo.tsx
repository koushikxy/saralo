import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg';

export const SaraloLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 1024 1024">
    <Defs>
      <LinearGradient id="saraloBg" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#6366F1" />
        <Stop offset="1" stopColor="#4338CA" />
      </LinearGradient>
    </Defs>
    <Rect width="1024" height="1024" rx="290" fill="url(#saraloBg)" />
    <Path
      d="M628 334 Q628 274 506 274 Q384 274 384 382 Q384 470 506 500 Q628 530 628 630 Q628 744 506 744 Q384 744 384 690"
      stroke="#FFFFFF"
      strokeWidth={96}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Circle cx="726" cy="238" r="58" fill="#FBBF24" />
  </Svg>
);

export const SaraloWordmark: React.FC<{ size?: number; color: string }> = ({ size = 38, color }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }} accessibilityRole="header" accessibilityLabel="Saralo">
    <Text style={{ fontFamily: 'GrandHotel_400Regular', fontSize: size, lineHeight: size * 1.25, color, includeFontPadding: false }}>Saralo</Text>
    <View style={{ width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: '#FBBF24', marginTop: size * 0.22, marginLeft: 1 }} />
  </View>
);
