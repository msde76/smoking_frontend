import * as Speech from 'expo-speech';

export const useVoiceOutput = () => {
  // (TODO: 향후 DeviceContext에서 ttsPreference를 가져와 rate/pitch 설정)
  const options = {
    language: 'ko-KR',
    pitch: 1.0, 
    rate: 0.9,
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