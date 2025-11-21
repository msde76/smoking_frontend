import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TapGestureHandler } from 'react-native-gesture-handler';
import { parseCommand } from '../../api/nluService';
import { findRouteByAddress } from '../../api/routeService';
import { useDevice } from '../../contexts/DeviceContext';
import { useRoute } from '../../contexts/RouteContext';
import { useLocation } from '../../hooks/useLocation';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useVoiceOutput } from '../../hooks/useVoiceOutput';

export default function VoiceCommandButton() {
  const { recognizedText, isListening, error, startListening } = useVoiceInput();
  const { deviceId } = useDevice();
  const { location } = useLocation();
  const { loadRoute, guidanceSteps, currentStepIndex } = useRoute();
  const { speak, stop } = useVoiceOutput();

  const [systemMessage, setSystemMessage] = useState('목적지를 검색하거나 하단 안내판을 두 번 탭해 말씀해주세요.');
  const [isLoading, setIsLoading] = useState(false);
  const [manualDestination, setManualDestination] = useState('');
  const inputRef = useRef(null);
  const infoTapRef = useRef(null);

  useEffect(() => {
    if (recognizedText) {
      setSystemMessage(`인식된 텍스트: ${recognizedText}`);
      handleNluRequest(recognizedText);
    }
  }, [recognizedText]);

  const formatInstruction = useCallback((step, index) => {
    if (!step) return `단계 ${index + 1}. 안내 정보를 불러올 수 없습니다.`;

    const distanceMeters =
      typeof step.distanceMeters === 'number'
        ? step.distanceMeters
        : step.distanceText
        ? parseInt(step.distanceText.replace(/[^0-9]/g, ''), 10)
        : null;
    const distance =
      step.distanceText ||
      (typeof distanceMeters === 'number'
        ? `${Math.max(5, Math.round(distanceMeters / 5) * 5)}m`
        : null);
    const maneuver =
      step.maneuver ||
      step.action ||
      (step.text?.includes('좌') ? '좌회전' : step.text?.includes('우') ? '우회전' : null);
    const street = step.streetName || step.road || '';
    const baseText = step.text || '';

    if (index === 0 && (!distanceMeters || distanceMeters < 12) && maneuver) {
      return `현재 위치에서 ${maneuver}${street ? ` (${street})` : ''}`;
    }
    if (distance && maneuver) {
      return `${distance} 이동 후 ${maneuver}${street ? ` (${street})` : ''}`;
    }
    if (distance && baseText) {
      return `${distance} ${baseText}`;
    }
    return baseText || `단계 ${index + 1} 안내`;
  }, []);

  const buildSummaryText = useCallback(
    (routeData, destinationLabel) => {
      if (!routeData) return '경로 안내 정보를 불러올 수 없습니다.';

      const distanceText =
        routeData?.summary?.distanceText ||
        routeData?.distanceText ||
        routeData?.totalDistanceText;
      const durationText =
        routeData?.summary?.durationText ||
        routeData?.durationText ||
        routeData?.totalDurationText;
      const avoidedCount = routeData?.avoidedAreasCount ?? 0;
      const nextInstruction = formatInstruction(routeData?.voiceInstructions?.[0], 0);

      const parts = [
        destinationLabel
          ? `'${destinationLabel}'까지의 안전 경로를 찾았습니다.`
          : '안전 경로 안내를 시작합니다.',
        distanceText || durationText
          ? `총 ${distanceText ?? '거리 미확인'}, 예상 소요 ${durationText ?? '시간 미확인'}.`
          : null,
        avoidedCount > 0
          ? `흡연 구역 ${avoidedCount}곳을 우회합니다.`
          : '흡연 구역을 만나지 않는 경로입니다.',
        nextInstruction ? `첫 안내: ${nextInstruction}` : null,
      ].filter(Boolean);

      return parts.join(' ');
    },
    [formatInstruction],
  );

  const buildActionText = useCallback((step, formattedApproach) => {
    const base = step?.text || formattedApproach || '';
    if (base.includes('좌')) return '이제 좌회전 하세요.';
    if (base.includes('우')) return '이제 우회전 하세요.';
    if (base.includes('직진')) return '계속 직진하세요.';
    if (base.includes('유턴')) return '이제 유턴 하세요.';
    return '지금 안내를 따라 이동하세요.';
  }, []);

  const parseDistanceMeters = (step) => {
    if (typeof step?.distanceMeters === 'number') return step.distanceMeters;
    if (step?.distanceText) {
      const match = step.distanceText.match(/([\d.,]+)/);
      if (match) {
        const value = parseFloat(match[1].replace(',', ''));
        if (step.distanceText.includes('km')) {
          return value * 1000;
        }
        return value;
      }
    }
    return null;
  };

  const buildGuidanceSteps = useCallback(
    (routeData) => {
      const rawSteps = routeData?.voiceInstructions || [];
      const fallbackPath = routeData?.pathCoordinates || [];
      const destinationPoint =
        fallbackPath.length > 0
          ? { latitude: fallbackPath[fallbackPath.length - 1][0], longitude: fallbackPath[fallbackPath.length - 1][1] }
          : null;

      if (!rawSteps.length && fallbackPath.length) {
        return [
          {
            id: 'fallback',
            approachText: '경로 안내를 준비 중입니다. 지도에서 안내선을 참고해주세요.',
            actionText: '안내선 방향으로 이동하세요.',
            target: destinationPoint,
            triggerDistance: 20,
          },
        ];
      }

      return rawSteps.map((step, index) => {
        const approachText = formatInstruction(step, index);
        const actionText = buildActionText(step, approachText);
        const distanceMeters = parseDistanceMeters(step);
        const target =
          (typeof step?.latitude === 'number' && typeof step?.longitude === 'number'
            ? { latitude: step.latitude, longitude: step.longitude }
            : fallbackPath[index + 1]
            ? { latitude: fallbackPath[index + 1][0], longitude: fallbackPath[index + 1][1] }
            : destinationPoint) || null;
        const triggerDistance = Math.min(
          50,
          Math.max(12, distanceMeters ? Math.round(distanceMeters * 0.2) : 20),
        );

        return {
          id: `${index}-${step?.text || 'step'}`,
          approachText,
          actionText,
          target,
          triggerDistance,
        };
      });
    },
    [buildActionText, formatInstruction],
  );

  const narrateSummary = useCallback(
    (routeData, destinationLabel) => {
      const summary = buildSummaryText(routeData, destinationLabel);
      stop();
      speak(summary);
    },
    [buildSummaryText, speak, stop],
  );

  const requestRouteForDestination = useCallback(
    async (destinationLabel) => {
      if (!location) {
        setSystemMessage('현재 위치를 먼저 파악해야 합니다.');
        return;
      }
      if (!deviceId) {
        setSystemMessage('기기 ID를 로드 중입니다. 잠시 후 시도하세요.');
        return;
      }
      if (!destinationLabel) {
        setSystemMessage('목적지를 입력하거나 말씀해주세요.');
        return;
      }

      setIsLoading(true);
      try {
        setSystemMessage(`'${destinationLabel}' 경로를 분석 중입니다...`);

        const routeRequest = {
          deviceId: deviceId,
          startLatitude: location.latitude,
          startLongitude: location.longitude,
          endAddress: destinationLabel,
        };

        const routeResponse = await findRouteByAddress(routeRequest);
        const routeData = routeResponse.data.result;
        const guidance = buildGuidanceSteps(routeData);
        loadRoute(routeData, guidance);

        const summary = buildSummaryText(routeData, destinationLabel);
        setSystemMessage(summary);
        narrateSummary(routeData, destinationLabel);
        setManualDestination(destinationLabel);
      } catch (e) {
        setSystemMessage('경로 안내 중 오류가 발생했습니다: ' + e.message);
      } finally {
        setIsLoading(false);
        inputRef.current?.blur();
      }
    },
    [buildGuidanceSteps, buildSummaryText, deviceId, loadRoute, location, narrateSummary],
  );

  const handleNluRequest = async (text) => {
    setSystemMessage(`음성 명령 분석 중: ${text}`);
    if (!location) {
      setSystemMessage('현재 위치를 먼저 파악해야 합니다.');
      return;
    }
    if (!deviceId) {
      setSystemMessage('기기 ID를 로드 중입니다. 잠시 후 시도하세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await parseCommand(text);
      const nluResult = response.data.result;

      if (nluResult.intent === 'SEARCH_ROUTE') {
        await requestRouteForDestination(nluResult.destination);
      } else if (nluResult.intent === 'REPORT_SMOKING') {
        setSystemMessage('민원 신고가 접수되었습니다.');
      } else {
        setSystemMessage('명령을 이해하지 못했습니다.');
      }
    } catch (e) {
      setSystemMessage('오류 발생: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = useCallback(() => {
    const trimmed = manualDestination.trim();
    if (!trimmed) {
      setSystemMessage('검색창에 도착지를 입력한 후 안내 시작 버튼을 눌러주세요.');
      return;
    }
    requestRouteForDestination(trimmed);
  }, [manualDestination, requestRouteForDestination]);

  const handleVoiceTrigger = useCallback(() => {
    if (isLoading || isListening) {
      return;
    }
    setSystemMessage('음성 명령을 시작합니다...');
    startListening();
  }, [isListening, isLoading, startListening]);

  const currentGuidanceText =
    guidanceSteps[currentStepIndex]?.approachText || '경로가 준비되면 현재 안내가 여기에 표시됩니다.';

  return (
    <>
      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="가고 싶은 목적지를 입력하세요 (예: 강남역)"
          placeholderTextColor="#666"
          value={manualDestination}
          onChangeText={setManualDestination}
          onSubmitEditing={handleManualSearch}
          accessibilityLabel="목적지 검색 입력창"
          accessibilityHint="목적지를 입력하고 아래 안내 시작 버튼을 누르세요."
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[
            styles.searchButton,
            (isLoading || !manualDestination.trim()) && styles.searchButtonDisabled,
          ]}
          onPress={handleManualSearch}
          disabled={isLoading || !manualDestination.trim()}
          accessibilityRole="button"
          accessibilityLabel="입력한 목적지로 경로 안내 시작"
        >
          <Text style={styles.searchButtonText}>{isLoading ? '탐색 중...' : '안내 시작'}</Text>
        </TouchableOpacity>
      </View>

      <TapGestureHandler
        ref={infoTapRef}
        numberOfTaps={2}
        maxDurationMs={250}
        onActivated={handleVoiceTrigger}
      >
        <View style={styles.infoContainer} accessible accessibilityHint="이 안내판을 두 번 탭하거나 아래 버튼을 누르면 음성 명령을 시작합니다.">
          <View style={styles.statusRow}>
            {isListening && <Text style={styles.listeningBadge}>듣는 중</Text>}
            {isLoading && <ActivityIndicator size="small" color="#007AFF" style={styles.statusSpinner} />}
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoiceTrigger}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="음성 명령 시작"
            >
              <Text style={styles.voiceButtonText}>{isListening ? '듣는 중' : '🎙️ 음성 명령'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.currentGuidance}>{currentGuidanceText}</Text>
          <Text style={styles.systemMessage}>{systemMessage}</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <ScrollView style={styles.instructionsList} contentContainerStyle={styles.instructionsContent}>
            {guidanceSteps.length > 0 ? (
              guidanceSteps.map((step, index) => (
                <Text
                  key={step.id || `${index}-guidance`}
                  style={[
                    styles.instructionText,
                    index === currentStepIndex && styles.instructionTextActive,
                  ]}
                >
                  {`${index + 1}. ${step.approachText}`}
                </Text>
              ))
            ) : (
              <Text style={styles.instructionPlaceholder}>
                목적지를 입력하거나 하단 안내판을 두 번 탭해 음성 명령을 시작하세요.
                경로가 계산되면 현재 안내와 다음 단계들이 여기에 표시되고 음성으로도 안내해 드립니다.
              </Text>
            )}
          </ScrollView>
        </View>
      </TapGestureHandler>
    </>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    gap: 10,
  },
  searchInput: {
    backgroundColor: '#F4F5F7',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#A0CFFF',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 14,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 20,
  },
  voiceButton: {
    marginLeft: 'auto',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  voiceButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  listeningBadge: {
    backgroundColor: '#FF3B30',
    color: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 10,
  },
  statusSpinner: {
    marginLeft: 'auto',
  },
  currentGuidance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  systemMessage: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
  instructionsList: {
    maxHeight: 180,
  },
  instructionsContent: {
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  instructionTextActive: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  instructionPlaceholder: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});