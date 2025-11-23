import MainMapScreen from '@/src/screens/MainMapScreen';
import React from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { View } from 'react-native';

export default function TabIndexScreen() {
  // 오른쪽으로 스와이프하면 내정보로 이동
  const swipeRight = Gesture.Pan()
    .activeOffsetX(50)
    .onEnd((event) => {
      if (event.translationX > 100) {
        router.push('/(tabs)/explore');
      }
    });

  return (
    <GestureDetector gesture={swipeRight}>
      <View style={{ flex: 1 }}>
        <MainMapScreen />
      </View>
    </GestureDetector>
  );
}