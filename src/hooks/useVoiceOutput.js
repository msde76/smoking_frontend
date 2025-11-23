import * as Speech from 'expo-speech';
import { useVoiceSettings } from '../contexts/VoiceSettingsContext';

export const useVoiceOutput = () => {
  const { rate, pitch } = useVoiceSettings();
  
  const options = {
    language: 'ko-KR',
    pitch: pitch,
    rate: rate,
  };

  const speak = (text) => {
    if (text) {
      Speech.speak(text, options);
    }
  };

  const stop = () => {
    Speech.stop();
  };

  return { speak, stop };
};