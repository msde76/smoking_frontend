import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { parseCommand } from '../../api/nluService';
import { findRouteByAddress } from '../../api/routeService';
import { useDevice } from '../../contexts/DeviceContext';
import { useRoute } from '../../contexts/RouteContext';
import { useLocation } from '../../hooks/useLocation';
import { useVoiceInput } from '../../hooks/useVoiceInput';
// (api/reportService.js도 생성 필요)
// import { createReport } from '../../api/reportService'; 

export default function VoiceCommandButton() {
  const { recognizedText, isListening, error, startListening } = useVoiceInput();
  const { deviceId } = useDevice();
  const { location } = useLocation(); // (MainMapScreen에서 props로 받는 것이 더 좋음)
  const { loadRoute } = useRoute();
  
  const [statusText, setStatusText] = useState('명령어를 말씀하세요 (예: 강남역 가줘)');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (recognizedText) {
      setStatusText(`인식된 텍스트: ${recognizedText}`);
      handleNluRequest(recognizedText);
    }
  }, [recognizedText]);

  const handleNluRequest = async (text) => {
    if (!location) {
        setStatusText('현재 위치를 먼저 파악해야 합니다.');
        return;
    }
    if (!deviceId) {
        setStatusText('기기 ID를 로드 중입니다. 잠시 후 시도하세요.');
        return;
    }

    setIsLoading(true);
    try {
      const response = await parseCommand(text);
      const nluResult = response.data.result; 

      if (nluResult.intent === 'SEARCH_ROUTE') {
        setStatusText(`목적지 '${nluResult.destination}' 경로 탐색 중...`);
        
        const routeRequest = {
            deviceId: deviceId,
            startLatitude: location.latitude,
            startLongitude: location.longitude,
            endAddress: nluResult.destination 
        };
        
        const routeResponse = await findRouteByAddress(routeRequest);
        loadRoute(routeResponse.data.result); 
        
        const count = routeResponse.data.result.avoidedAreasCount || 0;
        setStatusText(count > 0 ? `경로 안내 시작. (흡연구역 ${count}개 탐지)` : '경로 안내를 시작합니다.');

      } else if (nluResult.intent === 'REPORT_SMOKING') {
        setStatusText(`민원 신고 접수 중...`);
        // (TODO: 4단계) reportService.js를 만들어 /api/v1/reports API 호출
        // await createReport({
        //     deviceId: deviceId,
        //     reportedLatitude: location.latitude,
        //     reportedLongitude: location.longitude,
        //     description: nluResult.reportContent,
        // });
        setStatusText('민원 신고가 접수되었습니다.');

      } else {
        setStatusText('명령을 이해하지 못했습니다.');
      }

    } catch (e) {
      // --- (수정) 'S' 오타 제거 ---
      setStatusText('오류 발생: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Pressable 
        style={[styles.button, isListening ? styles.buttonActive : null]}
        onPress={startListening}
        accessibilityLabel="음성 명령 시작"
        accessibilityHint="버튼을 누르고 목적지를 말씀하세요." // (이 줄은 정상이었습니다)
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isListening ? '듣는 중...' : '🎙️'}</Text>
        )}
      </Pressable>
      <Text style={styles.statusText}>{statusText}</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 30,
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  }
});