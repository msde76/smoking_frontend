import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useVoiceOutput } from '../hooks/useVoiceOutput';

const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [routeInfo, setRouteInfo] = useState(null); // 백엔드 응답 전체
  const [guidanceSteps, setGuidanceSteps] = useState([]); // {id, approachText, actionText, target, triggerDistance}
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const guidanceTimerRef = useRef(null);
  const { speak, stop } = useVoiceOutput();

  const clearGuidanceTimer = () => {
    if (guidanceTimerRef.current) {
      clearTimeout(guidanceTimerRef.current);
      guidanceTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearGuidanceTimer();
    };
  }, []);

  const announce = (text) => {
    if (!text) return;
    stop();
    speak(text);
  };

  const loadRoute = (routeData, steps = []) => {
    setRouteInfo(routeData);
    setGuidanceSteps(steps);
    setCurrentStepIndex(0);
    clearGuidanceTimer();
    if (steps.length) {
      announce(steps[0].approachText || steps[0].actionText);
    }
  };

  const clearRoute = () => {
    setRouteInfo(null);
    setGuidanceSteps([]);
    setCurrentStepIndex(0);
    clearGuidanceTimer();
    stop();
  };

  const advanceToStep = (nextIndex) => {
    clearGuidanceTimer();
    if (nextIndex < guidanceSteps.length) {
      setCurrentStepIndex(nextIndex);
      const nextStep = guidanceSteps[nextIndex];
      if (nextStep?.approachText) {
        guidanceTimerRef.current = setTimeout(() => {
          announce(nextStep.approachText);
        }, 1200);
      }
    }
  };

  const announceActionForCurrentStep = () => {
    const current = guidanceSteps[currentStepIndex];
    if (!current) return;
    announce(current.actionText || current.approachText);
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < guidanceSteps.length) {
      advanceToStep(nextIndex);
    } else {
      clearGuidanceTimer();
      announce('목적지에 도착했습니다.');
    }
  };

  return (
    <RouteContext.Provider
      value={{
        routeInfo,
        loadRoute,
        clearRoute,
        guidanceSteps,
        currentStepIndex,
        announceActionForCurrentStep,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => useContext(RouteContext);