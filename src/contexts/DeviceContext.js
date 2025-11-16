import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDevice } from '../api/deviceService';

const DeviceContext = createContext();

const DEVICE_ID_KEY = 'happywalk_device_id';

export const DeviceProvider = ({ children }) => {
  const [deviceId, setDeviceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupDevice = async () => {
      let storedId = null;
      try {
        storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

        if (!storedId) {
          storedId = Crypto.randomUUID();
          await SecureStore.setItemAsync(DEVICE_ID_KEY, storedId);
        }
        
        try {
          // 3. 백엔드 서버에 /init API 호출
          const response = await initDevice(storedId); 
          console.log('Backend init success:', response.data.result);
        } catch (error) {
          // (수정) 서버가 꺼져있거나 CORS 오류가 나도 앱은 계속 진행
          console.warn('Backend init FAILED, but proceeding:', error.message);
        }
        
        setDeviceId(storedId);

      } catch (error) {
        console.error('Failed to setup deviceId or context crash:', error);
      } finally {
        // (수정) 어떤 일이 있어도 로딩 상태는 반드시 해제
        setIsLoading(false);
      }
    };

    setupDevice();
  }, []);

  return (
    <DeviceContext.Provider value={{ deviceId, isLoading }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => useContext(DeviceContext);