import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { getSmokingAreas } from '../api/smokingAreaService';
import VoiceCommandButton from '../components/voice/VoiceCommandButton';
import { useRoute } from '../contexts/RouteContext';
import { useLocation } from '../hooks/useLocation';
import { useVoiceOutput } from '../hooks/useVoiceOutput';

// 서울시청 (GPS 권한 거부 시 기본 위치)
const INITIAL_REGION = {
  latitude: 37.5665,
  longitude: 126.9780,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MainMapScreen() {
  const { location, errorMsg, permissionGranted } = useLocation();
  const { routeInfo, guidanceSteps, currentStepIndex, announceActionForCurrentStep } = useRoute();
  const [smokingAreas, setSmokingAreas] = useState([]);
  const mapRef = useRef(null); 
  const { speak, stop } = useVoiceOutput();
  const awaitingStepRef = useRef(null);

  useEffect(() => {
    awaitingStepRef.current = null;
  }, [guidanceSteps]);

  const fetchAreas = useCallback(async (lat, lng) => {
    const buffer = 0.01; 
    try {
      const response = await getSmokingAreas(
        lat - buffer, lat + buffer,
        lng - buffer, lng + buffer
      );
      setSmokingAreas(response.data.result);
    } catch (error) {
      console.error('Failed to fetch smoking areas:', error.message);
    }
  }, []);

  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      fetchAreas(location.latitude, location.longitude);
    }
  }, [fetchAreas, location]); 

  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    if (
      typeof lat1 !== 'number' ||
      typeof lon1 !== 'number' ||
      typeof lat2 !== 'number' ||
      typeof lon2 !== 'number'
    ) {
      return Infinity;
    }
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!location || !guidanceSteps.length) return;
    const currentStep = guidanceSteps[currentStepIndex];
    if (!currentStep?.target) return;
    const distance = getDistanceMeters(
      location.latitude,
      location.longitude,
      currentStep.target.latitude,
      currentStep.target.longitude,
    );
    const threshold = currentStep.triggerDistance ?? 20;
    if (distance <= threshold && awaitingStepRef.current !== currentStep.id) {
      awaitingStepRef.current = currentStep.id;
      announceActionForCurrentStep();
    } else if (distance > threshold && awaitingStepRef.current === currentStep.id) {
      awaitingStepRef.current = null;
    }
  }, [announceActionForCurrentStep, currentStepIndex, guidanceSteps, location]);

  const handleLocateAndScan = useCallback(() => {
    if (!location || !mapRef.current) {
      stop();
      speak('현재 위치를 가져오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    mapRef.current.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    });
    fetchAreas(location.latitude, location.longitude);
    stop();
    speak('현재 위치로 이동했습니다. 주변 흡연 구역을 다시 탐색합니다.');
  }, [fetchAreas, location, speak, stop]);

  if (!permissionGranted) {
    return (
      <View style={styles.center}>
        {errorMsg ? <Text>{errorMsg}</Text> : <ActivityIndicator size="large" />}
        <Text style={styles.centerText}>
          {errorMsg ? errorMsg : 'GPS 위치 정보 권한을 확인 중입니다...'}
        </Text>
        <Text style={styles.centerText}>앱 설정에서 위치 권한을 허용해주세요.</Text>
      </View>
    );
  }
  
  // 백엔드: [[Lat, Lng]] -> Polyline: [{ latitude: Lat, longitude: Lng }]
  const polylineCoordinates = routeInfo?.pathCoordinates?.map(coords => ({
    latitude: coords[0], // Google Lat (0번 인덱스)
    longitude: coords[1], // Google Lng (1번 인덱스)
  })) || [];


  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE} 
        initialRegion={INITIAL_REGION}
        showsUserLocation={true} 
        showsMyLocationButton={true} 
        onTouchStart={() => stop()}
      >
        {/* 흡연구역 마커 (빨간색) */}
        {smokingAreas.map(area => (
          <Marker
            key={area.areaId}
            coordinate={{
              latitude: area.latitude,
              longitude: area.longitude,
            }}
            title={area.type || '흡연구역'}
            description={area.address}
            pinColor="red" 
          />
        ))}

        {/* 회피 경로 그리기 (파란색) */}
        {polylineCoordinates.length > 0 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor="#007AFF"
            strokeWidth={5}
          />
        )}
      </MapView>
      <TouchableOpacity
        style={styles.locateButton}
        onPress={handleLocateAndScan}
        accessibilityRole="button"
        accessibilityLabel="현재 위치로 이동하고 주변 흡연 구역 다시 탐색"
      >
        <Text style={styles.locateButtonText}>내 위치 + 흡연구역</Text>
      </TouchableOpacity>

      <VoiceCommandButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject, 
  },
  locateButton: {
    position: 'absolute',
    top: 110,
    right: 16,
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    elevation: 4,
  },
  locateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centerText: {
    marginTop: 10,
    textAlign: 'center',
  }
});