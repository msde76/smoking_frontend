import React, { createContext, useContext, useState } from 'react';
import { useVoiceOutput } from '../hooks/useVoiceOutput';

const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [routeInfo, setRouteInfo] = useState(null); // 백엔드 응답 전체
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const { speak } = useVoiceOutput();

  const loadRoute = (routeData) => {
    setRouteInfo(routeData);
    setCurrentInstructionIndex(0);
    
    // 경로가 로드되면 첫 번째 음성 안내 시작
    if (routeData?.voiceInstructions?.length > 0) {
      speak(routeData.voiceInstructions[0].text);
    }
  };

  const clearRoute = () => {
    setRouteInfo(null);
    setCurrentInstructionIndex(0);
  };

  const playNextInstruction = () => {
    if (!routeInfo || currentInstructionIndex >= routeInfo.voiceInstructions.length - 1) {
      return;
    }
    const nextIndex = currentInstructionIndex + 1;
    speak(routeInfo.voiceInstructions[nextIndex].text);
    setCurrentInstructionIndex(nextIndex);
  };

  return (
    <RouteContext.Provider value={{ routeInfo, loadRoute, clearRoute, playNextInstruction }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => useContext(RouteContext);