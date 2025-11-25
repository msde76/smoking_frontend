import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, TouchableWithoutFeedback } from 'react-native';

export default function CustomSlider({ 
  value, 
  onValueChange, 
  minimumValue = 0, 
  maximumValue = 1, 
  step = 0.1,
  onSlidingComplete = () => {},
  style = {},
  trackStyle = {},
  thumbStyle = {},
  minimumTrackTintColor = '#007AFF',
  maximumTrackTintColor = '#E5E5E5',
  thumbTintColor = '#007AFF',
  width = '100%',
  height = 40,
}) {
  const pan = useRef(new Animated.Value(0)).current;
  const sliderWidth = useRef(0);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const thumbSize = 24;

  const getValueFromPosition = (x) => {
    if (sliderWidth.current === 0) return value;
    const availableWidth = sliderWidth.current - thumbSize;
    const ratio = Math.max(0, Math.min(1, x / availableWidth));
    const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(minimumValue, Math.min(maximumValue, steppedValue));
  };

  const getPositionFromValue = (val) => {
    if (sliderWidth.current === 0) return 0;
    const availableWidth = sliderWidth.current - thumbSize;
    const ratio = (val - minimumValue) / (maximumValue - minimumValue);
    return ratio * availableWidth;
  };

  useEffect(() => {
    if (isLayoutReady && sliderWidth.current > 0) {
      const position = getPositionFromValue(value);
      pan.setValue(position);
    }
  }, [value, isLayoutReady]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const availableWidth = sliderWidth.current - thumbSize;
        const newX = Math.max(0, Math.min(availableWidth, touchX - thumbSize / 2));
        pan.setValue(newX);
        const newValue = getValueFromPosition(newX);
        onValueChange(newValue);
      },
      onPanResponderMove: (evt, gestureState) => {
        const availableWidth = sliderWidth.current - thumbSize;
        const touchX = evt.nativeEvent.locationX;
        const newX = Math.max(0, Math.min(availableWidth, touchX - thumbSize / 2));
        pan.setValue(newX);
        const newValue = getValueFromPosition(newX);
        onValueChange(newValue);
      },
      onPanResponderRelease: () => {
        const currentX = pan.__getValue();
        const newValue = getValueFromPosition(currentX);
        onSlidingComplete(newValue);
      },
    })
  ).current;

  const handleTrackPress = (evt) => {
    if (sliderWidth.current === 0) return;
    const touchX = evt.nativeEvent.locationX;
    const availableWidth = sliderWidth.current - thumbSize;
    const newX = Math.max(0, Math.min(availableWidth, touchX - thumbSize / 2));
    pan.setValue(newX);
    const newValue = getValueFromPosition(newX);
    onValueChange(newValue);
    onSlidingComplete(newValue);
  };

  return (
    <View
      style={[styles.container, style, { width, height }]}
      onLayout={(event) => {
        const newWidth = event.nativeEvent.layout.width;
        if (newWidth > 0 && newWidth !== sliderWidth.current) {
          sliderWidth.current = newWidth;
          setIsLayoutReady(true);
          const position = getPositionFromValue(value);
          pan.setValue(position);
        }
      }}
    >
      <TouchableWithoutFeedback onPress={handleTrackPress}>
        <View style={[styles.track, { backgroundColor: maximumTrackTintColor }, trackStyle]} />
      </TouchableWithoutFeedback>
      {isLayoutReady && (
        <Animated.View
          style={[
            styles.minimumTrack,
            {
              backgroundColor: minimumTrackTintColor,
              width: pan.interpolate({
                inputRange: [0, Math.max(1, sliderWidth.current - thumbSize)],
                outputRange: [0, Math.max(1, sliderWidth.current - thumbSize)],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      )}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumb,
          {
            backgroundColor: thumbTintColor,
            width: thumbSize,
            height: thumbSize,
            transform: [{ translateX: pan }],
          },
          thumbStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    width: '100%',
  },
  minimumTrack: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
});

