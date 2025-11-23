import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

const UIScaleContext = createContext();

const UI_SCALE_KEY = 'ui_scale';

const MIN_SCALE = 0.8; // 최소 크기 (현재의 80%)
const DEFAULT_SCALE = 1.0; // 기본 크기 (100%)
const MAX_SCALE = 2.0; // 최대 크기 (200%)

export const UIScaleProvider = ({ children }) => {
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScale = async () => {
      try {
        const storedScale = await SecureStore.getItemAsync(UI_SCALE_KEY);
        if (storedScale) {
          const scaleValue = parseFloat(storedScale);
          // 저장된 값이 유효한 범위 내에 있는지 확인
          if (scaleValue >= MIN_SCALE && scaleValue <= MAX_SCALE) {
            setScale(scaleValue);
          }
        }
      } catch (error) {
        console.error('Failed to load UI scale:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadScale();
  }, []);

  const updateScale = async (newScale) => {
    try {
      // 범위 제한
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      await SecureStore.setItemAsync(UI_SCALE_KEY, clampedScale.toString());
      setScale(clampedScale);
    } catch (error) {
      console.error('Failed to save UI scale:', error);
    }
  };

  const resetToDefault = async () => {
    await updateScale(DEFAULT_SCALE);
  };

  // 헬퍼 함수들: 스케일에 따라 크기를 조절
  const scaleFont = (baseSize) => Math.round(baseSize * scale);
  const scaleSize = (baseSize) => Math.round(baseSize * scale);
  const scaleSpacing = (baseSpacing) => Math.round(baseSpacing * scale);

  return (
    <UIScaleContext.Provider
      value={{
        scale,
        isLoading,
        updateScale,
        resetToDefault,
        scaleFont,
        scaleSize,
        scaleSpacing,
        MIN_SCALE,
        DEFAULT_SCALE,
        MAX_SCALE,
      }}>
      {children}
    </UIScaleContext.Provider>
  );
};

export const useUIScale = () => useContext(UIScaleContext);

