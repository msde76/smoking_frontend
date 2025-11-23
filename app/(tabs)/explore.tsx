import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMyReports } from '@/src/api/reportService';
import CustomSlider from '@/src/components/CustomSlider';
import { useDevice } from '@/src/contexts/DeviceContext';
import { useUIScale } from '@/src/contexts/UIScaleContext';
import { useVoiceSettings } from '@/src/contexts/VoiceSettingsContext';
import { useVoiceOutput } from '@/src/hooks/useVoiceOutput';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TabTwoScreen() {
  const { deviceId } = useDevice();
  const { rate, pitch, updateRate, updatePitch, resetToDefaults } = useVoiceSettings();
  const { scale, updateScale, resetToDefault, scaleFont, scaleSize, scaleSpacing, MIN_SCALE, MAX_SCALE } = useUIScale();
  const { speak } = useVoiceOutput();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [tempRate, setTempRate] = useState(rate.toString());
  const [tempPitch, setTempPitch] = useState(pitch.toString());

  // 왼쪽으로 스와이프하면 길찾기로 이동
  const swipeLeft = Gesture.Pan()
    .activeOffsetX(-50)
    .onEnd((event) => {
      if (event.translationX < -100) {
        router.push('/(tabs)/' as any);
      }
    });

  useEffect(() => {
    setTempRate(rate.toString());
    setTempPitch(pitch.toString());
  }, [rate, pitch]);

  const handleLoadReports = useCallback(async () => {
    if (!deviceId) {
      Alert.alert('오류', '기기 ID를 불러올 수 없습니다.');
      return;
    }

    setIsLoadingReports(true);
    try {
      const response = await getMyReports(deviceId);
      setReports(response.data.result || []);
      speak(`신고 내역 ${response.data.result?.length || 0}건을 불러왔습니다.`);
    } catch (error) {
      console.error('Failed to load reports:', error);
      Alert.alert('오류', '신고 내역을 불러오는 중 오류가 발생했습니다.');
      speak('신고 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingReports(false);
    }
  }, [deviceId, speak]);

  // 탭이 포커스를 받을 때마다 신고 내역 자동 로드
  useFocusEffect(
    useCallback(() => {
      if (deviceId) {
        handleLoadReports();
      }
    }, [deviceId, handleLoadReports])
  );

  const handleSaveRate = useCallback(() => {
    const numRate = parseFloat(tempRate);
    if (isNaN(numRate) || numRate < 0.1 || numRate > 2.0) {
      Alert.alert('오류', '속도는 0.1부터 2.0 사이의 값이어야 합니다.');
      return;
    }
    updateRate(numRate);
    speak('음성 속도가 저장되었습니다.');
  }, [tempRate, updateRate, speak]);

  const handleSavePitch = useCallback(() => {
    const numPitch = parseFloat(tempPitch);
    if (isNaN(numPitch) || numPitch < 0.1 || numPitch > 2.0) {
      Alert.alert('오류', '음높이는 0.1부터 2.0 사이의 값이어야 합니다.');
      return;
    }
    updatePitch(numPitch);
    speak('음높이가 저장되었습니다.');
  }, [tempPitch, updatePitch, speak]);

  const handleTestVoice = useCallback(() => {
    speak('음성 설정 테스트입니다. 현재 속도와 음높이로 읽고 있습니다.');
  }, [speak]);

  const handleResetSettings = useCallback(() => {
    resetToDefaults();
    speak('음성 설정이 기본값으로 초기화되었습니다.');
  }, [resetToDefaults, speak]);

  const handleScaleChange = useCallback((value: any) => {
    updateScale(value);
  }, [updateScale]);

  const handleResetUIScale = useCallback(() => {
    resetToDefault();
    speak('UI 크기가 기본값으로 초기화되었습니다.');
  }, [resetToDefault, speak]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '날짜 없음';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const dynamicStyles: any = {
    container: {
      flex: 1,
    },
    content: {
      padding: SCREEN_WIDTH * 0.04 * scale,
      gap: SCREEN_HEIGHT * 0.025 * scale,
    },
    section: {
      backgroundColor: '#fff',
      borderRadius: scaleSize(12),
      padding: SCREEN_WIDTH * 0.04 * scale,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    sectionTitle: {
      fontSize: scaleFont(Math.max(18, SCREEN_WIDTH * 0.05)),
      fontWeight: '600',
      marginBottom: SCREEN_HEIGHT * 0.02 * scale,
    },
    labelText: {
      fontSize: scaleFont(Math.max(14, SCREEN_WIDTH * 0.04)),
      fontWeight: '500',
      color: '#111',
    },
    hintText: {
      fontSize: scaleFont(Math.max(10, SCREEN_WIDTH * 0.03)),
      color: '#666',
      marginTop: SCREEN_HEIGHT * 0.005 * scale,
    },
    input: {
      flex: 1,
      backgroundColor: '#F4F5F7',
      borderRadius: scaleSize(8),
      paddingHorizontal: SCREEN_WIDTH * 0.03 * scale,
      paddingVertical: SCREEN_HEIGHT * 0.012 * scale,
      fontSize: scaleFont(Math.max(14, SCREEN_WIDTH * 0.04)),
      color: '#111',
      minHeight: SCREEN_HEIGHT * 0.05 * scale,
    },
    saveButton: {
      backgroundColor: '#007AFF',
      borderRadius: scaleSize(8),
      paddingHorizontal: SCREEN_WIDTH * 0.04 * scale,
      paddingVertical: SCREEN_HEIGHT * 0.012 * scale,
      justifyContent: 'center',
      minHeight: SCREEN_HEIGHT * 0.05 * scale,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: scaleFont(Math.max(12, SCREEN_WIDTH * 0.035)),
      fontWeight: '600',
    },
    writeButton: {
      backgroundColor: '#34C759',
      borderRadius: scaleSize(8),
      paddingHorizontal: SCREEN_WIDTH * 0.035 * scale,
      paddingVertical: SCREEN_HEIGHT * 0.01 * scale,
      minHeight: SCREEN_HEIGHT * 0.04 * scale,
    },
    writeButtonText: {
      color: '#fff',
      fontSize: scaleFont(Math.max(12, SCREEN_WIDTH * 0.035)),
      fontWeight: '600',
    },
    loadButton: {
      backgroundColor: '#007AFF',
      borderRadius: scaleSize(8),
      paddingHorizontal: SCREEN_WIDTH * 0.04 * scale,
      paddingVertical: SCREEN_HEIGHT * 0.01 * scale,
      minHeight: SCREEN_HEIGHT * 0.04 * scale,
    },
    loadButtonText: {
      color: '#fff',
      fontSize: scaleFont(Math.max(12, SCREEN_WIDTH * 0.035)),
      fontWeight: '600',
    },
    testButton: {
      flex: 1,
      backgroundColor: '#34C759',
      borderRadius: scaleSize(8),
      paddingVertical: SCREEN_HEIGHT * 0.015 * scale,
      alignItems: 'center',
      minHeight: SCREEN_HEIGHT * 0.05 * scale,
    },
    testButtonText: {
      color: '#fff',
      fontSize: scaleFont(Math.max(12, SCREEN_WIDTH * 0.035)),
      fontWeight: '600',
    },
    resetButton: {
      flex: 1,
      backgroundColor: '#FF9500',
      borderRadius: scaleSize(8),
      paddingVertical: SCREEN_HEIGHT * 0.015 * scale,
      alignItems: 'center',
      minHeight: SCREEN_HEIGHT * 0.05 * scale,
    },
    resetButtonText: {
      color: '#fff',
      fontSize: scaleFont(Math.max(12, SCREEN_WIDTH * 0.035)),
      fontWeight: '600',
    },
    emptyText: {
      fontSize: scaleFont(Math.max(12, SCREEN_WIDTH * 0.035)),
      color: '#666',
      textAlign: 'center',
    },
    reportCard: {
      backgroundColor: '#F9F9F9',
      borderRadius: scaleSize(8),
      padding: SCREEN_WIDTH * 0.03 * scale,
      borderLeftWidth: 3,
      borderLeftColor: '#007AFF',
    },
    reportDate: {
      fontSize: scaleFont(Math.max(10, SCREEN_WIDTH * 0.03)),
      color: '#666',
      marginBottom: SCREEN_HEIGHT * 0.005 * scale,
    },
    reportDescription: {
      fontSize: scaleFont(Math.max(13, SCREEN_WIDTH * 0.037)),
      color: '#111',
      marginBottom: SCREEN_HEIGHT * 0.007 * scale,
      fontWeight: '500',
    },
    reportAddress: {
      fontSize: scaleFont(Math.max(11, SCREEN_WIDTH * 0.033)),
      color: '#666',
      marginTop: SCREEN_HEIGHT * 0.005 * scale,
    },
    reportStatus: {
      fontSize: scaleFont(Math.max(10, SCREEN_WIDTH * 0.03)),
      color: '#007AFF',
      marginTop: SCREEN_HEIGHT * 0.005 * scale,
      fontWeight: '500',
    },
  };

  return (
    <GestureDetector gesture={swipeLeft}>
      <ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.content}>
      <ThemedView style={dynamicStyles.section}>
        <ThemedText type="title" style={dynamicStyles.sectionTitle}>
          음성 설정
        </ThemedText>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={dynamicStyles.labelText}>음성 속도</Text>
            <Text style={dynamicStyles.hintText}>현재: {rate.toFixed(2)} (0.1 ~ 2.0)</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={dynamicStyles.input}
              value={tempRate}
              onChangeText={setTempRate}
              keyboardType="decimal-pad"
              placeholder="0.9"
              accessibilityLabel="음성 속도 입력"
            />
            <TouchableOpacity style={dynamicStyles.saveButton} onPress={handleSaveRate}>
              <Text style={dynamicStyles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={dynamicStyles.labelText}>음높이</Text>
            <Text style={dynamicStyles.hintText}>현재: {pitch.toFixed(2)} (0.1 ~ 2.0)</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={dynamicStyles.input}
              value={tempPitch}
              onChangeText={setTempPitch}
              keyboardType="decimal-pad"
              placeholder="1.0"
              accessibilityLabel="음높이 입력"
            />
            <TouchableOpacity style={dynamicStyles.saveButton} onPress={handleSavePitch}>
              <Text style={dynamicStyles.saveButtonText}>저장</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={dynamicStyles.testButton} onPress={handleTestVoice}>
            <Text style={dynamicStyles.testButtonText}>음성 테스트</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dynamicStyles.resetButton} onPress={handleResetSettings}>
            <Text style={dynamicStyles.resetButtonText}>기본값으로 초기화</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={dynamicStyles.section}>
        <ThemedText type="title" style={dynamicStyles.sectionTitle}>
          UI 크기 조절
        </ThemedText>

        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Text style={dynamicStyles.labelText}>UI 크기</Text>
            <Text style={dynamicStyles.hintText}>
              현재: {(scale * 100).toFixed(0)}% (최소: {(MIN_SCALE * 100).toFixed(0)}%, 최대: {(MAX_SCALE * 100).toFixed(0)}%)
            </Text>
          </View>
          <View style={{ marginVertical: scaleSpacing(16) }}>
            <CustomSlider
              width="100%"
              height={scaleSize(40)}
              minimumValue={MIN_SCALE}
              maximumValue={MAX_SCALE}
              value={scale}
              onValueChange={handleScaleChange}
              step={0.1}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#E5E5E5"
              thumbTintColor="#007AFF"
            />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={dynamicStyles.resetButton} onPress={handleResetUIScale}>
            <Text style={dynamicStyles.resetButtonText}>기본값으로 초기화</Text>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={dynamicStyles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="title" style={dynamicStyles.sectionTitle}>
            나의 신고 내역
          </ThemedText>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={dynamicStyles.writeButton}
              onPress={() => router.push('/report' as any)}
              accessibilityLabel="신고 작성하기">
              <Text style={dynamicStyles.writeButtonText}>작성하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={dynamicStyles.loadButton}
              onPress={handleLoadReports}
              disabled={isLoadingReports || !deviceId}>
              {isLoadingReports ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={dynamicStyles.loadButtonText}>새로고침</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={dynamicStyles.emptyText}>
              {isLoadingReports
                ? '신고 내역을 불러오는 중...'
                : '신고 내역이 없습니다. 위의 새로고침 버튼을 눌러 확인하세요.'}
            </Text>
          </View>
        ) : (
          <View style={styles.reportsList}>
            {reports.map((report, index) => (
              <View key={report.reportId || index} style={dynamicStyles.reportCard}>
                <Text style={dynamicStyles.reportDate}>{formatDate(report.createdAt || report.reportedAt)}</Text>
                {report.description && (
                  <Text style={dynamicStyles.reportDescription}>{report.description}</Text>
                )}
                {report.address && (
                  <Text style={dynamicStyles.reportAddress}>📍 {report.address}</Text>
                )}
                {report.status && (
                  <Text style={dynamicStyles.reportStatus}>상태: {report.status}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ThemedView>
    </ScrollView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  writeButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  writeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    marginBottom: 20,
  },
  settingLabel: {
    marginBottom: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  reportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  reportDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 15,
    color: '#111',
    marginBottom: 6,
    fontWeight: '500',
  },
  reportAddress: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  reportStatus: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
  },
});
