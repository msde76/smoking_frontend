import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DeviceProvider } from '../src/contexts/DeviceContext';
import { RouteProvider } from '../src/contexts/RouteContext';
import { UIScaleProvider } from '../src/contexts/UIScaleContext';
import { VoiceSettingsProvider } from '../src/contexts/VoiceSettingsContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <DeviceProvider>
      <UIScaleProvider>
        <VoiceSettingsProvider>
          <RouteProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </RouteProvider>
        </VoiceSettingsProvider>
      </UIScaleProvider>
    </DeviceProvider>
    </GestureHandlerRootView>
  );
}