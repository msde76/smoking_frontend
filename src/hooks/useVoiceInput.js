import Voice from '@react-native-voice/voice';
import { useCallback, useEffect, useState } from 'react';

export const useVoiceInput = () => {
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  const onSpeechResults = (e) => {
    setRecognizedText(e.value[0] || '');
    setIsListening(false);
  };

  const onSpeechError = (e) => {
    setError(e.error?.message || 'Speech recognition error');
    setIsListening(false);
  };

  const onSpeechStart = () => setIsListening(true);
  const onSpeechEnd = () => setIsListening(false);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = useCallback(async () => {
    console.log("### 마이크 버튼 눌림, startListening 함수 실행됨 ###");
    try {
      setRecognizedText('');
      setError('');
      await Voice.start('ko-KR'); // 한국어
    } catch (e) {
      console.error("VOICE ERROR:", e);
      setError(e.message);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error("VOICE ERROR:", e);
      setError(e.message);
    }
  }, []);

  return {
    recognizedText, 
    isListening,
    error,
    startListening, 
    stopListening,
  };
};