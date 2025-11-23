import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useDevice } from '@/src/contexts/DeviceContext';
import { useLocation } from '@/src/hooks/useLocation';
import { createReport } from '@/src/api/reportService';
import { useVoiceOutput } from '@/src/hooks/useVoiceOutput';

export default function ReportScreen() {
  const { deviceId } = useDevice();
  const { location } = useLocation();
  const { speak } = useVoiceOutput();
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) {
      Alert.alert('오류', '신고 내용을 입력해주세요.');
      speak('신고 내용을 입력해주세요.');
      return;
    }

    if (!location) {
      Alert.alert('오류', '현재 위치를 불러올 수 없습니다.');
      speak('현재 위치를 불러올 수 없습니다.');
      return;
    }

    if (!deviceId) {
      Alert.alert('오류', '기기 ID를 불러올 수 없습니다.');
      speak('기기 ID를 불러올 수 없습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportData = {
        deviceId: deviceId,
        reportedLatitude: location.latitude,
        reportedLongitude: location.longitude,
        description: description.trim(),
      };

      await createReport(reportData);
      speak('신고가 성공적으로 접수되었습니다.');
      Alert.alert('성공', '신고가 성공적으로 접수되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            setDescription('');
            router.back();
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to create report:', error);
      const errorMessage = error.response?.data?.message || error.message || '알 수 없는 오류';
      Alert.alert('오류', `신고 접수 중 오류가 발생했습니다: ${errorMessage}`);
      speak('신고 접수 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [description, deviceId, location, speak]);

  const handleCancel = useCallback(() => {
    if (description.trim()) {
      Alert.alert('확인', '작성 중인 내용이 있습니다. 정말 취소하시겠습니까?', [
        { text: '계속 작성', style: 'cancel' },
        {
          text: '취소',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]);
    } else {
      router.back();
    }
  }, [description]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>흡연 구역 신고</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📍 현재 위치</Text>
          {location ? (
            <Text style={styles.infoText}>
              위도: {location.latitude.toFixed(6)}, 경도: {location.longitude.toFixed(6)}
            </Text>
          ) : (
            <Text style={styles.infoTextError}>위치 정보를 불러오는 중...</Text>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>신고 내용 *</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="흡연 구역의 위치, 상황 등을 자세히 설명해주세요."
            placeholderTextColor="#999"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            accessibilityLabel="신고 내용 입력"
            accessibilityHint="흡연 구역에 대한 상세한 설명을 입력하세요."
          />
          <Text style={styles.hintText}>
            예: 강남역 2번 출구 앞 보행자 도로에서 흡연이 빈번하게 발생하고 있습니다.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !description.trim() || !location || !deviceId}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>신고 접수</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  infoTextError: {
    fontSize: 13,
    color: '#FF3B30',
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111',
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0CFFF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

