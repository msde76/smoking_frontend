import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState(null); // { latitude, longitude }
  const [errorMsg, setErrorMsg] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('위치 정보 접근 권한이 거부되었습니다.');
        setPermissionGranted(false);
        return;
      }
      setPermissionGranted(true);

      try {
        let currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
        });
        setLocation(currentLocation.coords);
      } catch (error) {
          setErrorMsg('현재 위치를 가져올 수 없습니다.');
      }
    })();
  }, []);

  return { location, errorMsg, permissionGranted };
};