import { useCallback, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export const useVoiceInput = () => {
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setError('');
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript ?? '';
    if (transcript) {
      setRecognizedText(transcript);
    }
    if (event.isFinal) {
      setIsListening(false);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message || 'Speech recognition error');
    setIsListening(false);
  });

  const ensurePermissions = useCallback(async () => {
    const status = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return status.granted;
  }, []);

  const startListening = useCallback(async () => {
    console.log('### 마이크 버튼 눌림, startListening 함수 실행됨 ###');
    setRecognizedText('');
    setError('');

    try {
      const granted = await ensurePermissions();
      if (!granted) {
        setError('음성 명령을 위해 마이크 권한이 필요합니다.');
        return;
      }

      await ExpoSpeechRecognitionModule.start({
        lang: 'ko-KR',
        interimResults: false,
        continuous: false,
      });
    } catch (e) {
      console.error('VOICE ERROR:', e);
      setError(e?.message || '음성 인식을 시작할 수 없습니다.');
      setIsListening(false);
    }
  }, [ensurePermissions]);

  const stopListening = useCallback(async () => {
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch (e) {
      console.error('VOICE ERROR:', e);
      setError(e?.message || '음성 인식을 중지할 수 없습니다.');
    } finally {
      setIsListening(false);
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