import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDevice } from './DeviceContext';
import { updateVoicePreferences } from '../api/deviceService';

const VoiceSettingsContext = createContext();

const VOICE_RATE_KEY = 'voice_rate';
const VOICE_PITCH_KEY = 'voice_pitch';

const DEFAULT_RATE = 0.9;
const DEFAULT_PITCH = 1.0;

export const VoiceSettingsProvider = ({ children }) => {
  const { deviceId } = useDevice();
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [pitch, setPitch] = useState(DEFAULT_PITCH);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedRate = await SecureStore.getItemAsync(VOICE_RATE_KEY);
        const storedPitch = await SecureStore.getItemAsync(VOICE_PITCH_KEY);
        
        if (storedRate) {
          setRate(parseFloat(storedRate));
        }
        if (storedPitch) {
          setPitch(parseFloat(storedPitch));
        }
      } catch (error) {
        console.error('Failed to load voice settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateRate = async (newRate) => {
    try {
      // 로컬 저장소에 저장
      await SecureStore.setItemAsync(VOICE_RATE_KEY, newRate.toString());
      setRate(newRate);
      
      // 백엔드에 저장
      if (deviceId) {
        try {
          await updateVoicePreferences(deviceId, {
            voiceRate: newRate,
            voicePitch: pitch,
          });
        } catch (backendError) {
          console.warn('Failed to save voice rate to backend:', backendError.message);
          // 백엔드 저장 실패해도 로컬 저장은 성공했으므로 계속 진행
        }
      }
    } catch (error) {
      console.error('Failed to save voice rate:', error);
    }
  };

  const updatePitch = async (newPitch) => {
    try {
      // 로컬 저장소에 저장
      await SecureStore.setItemAsync(VOICE_PITCH_KEY, newPitch.toString());
      setPitch(newPitch);
      
      // 백엔드에 저장
      if (deviceId) {
        try {
          await updateVoicePreferences(deviceId, {
            voiceRate: rate,
            voicePitch: newPitch,
          });
        } catch (backendError) {
          console.warn('Failed to save voice pitch to backend:', backendError.message);
          // 백엔드 저장 실패해도 로컬 저장은 성공했으므로 계속 진행
        }
      }
    } catch (error) {
      console.error('Failed to save voice pitch:', error);
    }
  };

  const resetToDefaults = async () => {
    try {
      // 로컬 저장소에 저장
      await SecureStore.setItemAsync(VOICE_RATE_KEY, DEFAULT_RATE.toString());
      await SecureStore.setItemAsync(VOICE_PITCH_KEY, DEFAULT_PITCH.toString());
      setRate(DEFAULT_RATE);
      setPitch(DEFAULT_PITCH);
      
      // 백엔드에 저장
      if (deviceId) {
        try {
          await updateVoicePreferences(deviceId, {
            voiceRate: DEFAULT_RATE,
            voicePitch: DEFAULT_PITCH,
          });
        } catch (backendError) {
          console.warn('Failed to save voice preferences to backend:', backendError.message);
          // 백엔드 저장 실패해도 로컬 저장은 성공했으므로 계속 진행
        }
      }
    } catch (error) {
      console.error('Failed to reset voice settings:', error);
    }
  };

  return (
    <VoiceSettingsContext.Provider
      value={{
        rate,
        pitch,
        isLoading,
        updateRate,
        updatePitch,
        resetToDefaults,
      }}>
      {children}
    </VoiceSettingsContext.Provider>
  );
};

export const useVoiceSettings = () => useContext(VoiceSettingsContext);

