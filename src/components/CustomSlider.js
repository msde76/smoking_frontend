import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';

export default function CustomSlider({ 
  value, 
  onValueChange, 
  minimumValue = 0, 
  maximumValue = 1, 
  step = 0.1,
  style = {},
  trackStyle = {},
  thumbStyle = {},
  minimumTrackTintColor = '#007AFF',
  maximumTrackTintColor = '#E5E5E5',
  thumbTintColor = '#007AFF',
  width = '100%',
  height = 40,
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const sliderWidth = useRef(0);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const thumbSize = 20;

  const getValueFromPosition = (x) => {
    if (sliderWidth.current === 0) return value;
    const ratio = Math.max(0, Math.min(1, x / (sliderWidth.current - thumbSize)));
    const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(minimumValue, Math.min(maximumValue, steppedValue));
  };

  const getPositionFromValue = (val) => {
    if (sliderWidth.current === 0) return 0;
    const ratio = (val - minimumValue) / (maximumValue - minimumValue);
    return ratio * (sliderWidth.current - thumbSize);
  };

  useEffect(() => {
    if (isLayoutReady && sliderWidth.current > 0) {
      const position = getPositionFromValue(value);
      pan.setValue({ x: position, y: 0 });
    }
  }, [value, isLayoutReady]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentX = pan.x._value + gestureState.dx;
        const maxX = sliderWidth.current - thumbSize;
        const newX = Math.max(0, Math.min(maxX, currentX));
        pan.x.setValue(newX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        const currentX = pan.x._value;
        const newValue = getValueFromPosition(currentX);
        onValueChange(newValue);
      },
    })
  ).current;

  return (
    <View
      style={[styles.container, style, { width, height }]}
      onLayout={(event) => {
        const newWidth = event.nativeEvent.layout.width;
        if (newWidth > 0 && newWidth !== sliderWidth.current) {
          sliderWidth.current = newWidth;
          setIsLayoutReady(true);
          const position = getPositionFromValue(value);
          pan.setValue({ x: position, y: 0 });
        }
      }}
    >
      <View style={[styles.track, { backgroundColor: maximumTrackTintColor }, trackStyle]} />
      {isLayoutReady && (
        <Animated.View
          style={[
            styles.minimumTrack,
            {
              backgroundColor: minimumTrackTintColor,
              width: pan.x.interpolate({
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
            transform: [{ translateX: pan.x }],
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

