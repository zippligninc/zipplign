'use client';

import { useCallback, useRef, useState } from 'react';

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
}

interface SwipeHandler {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  threshold?: number;
  timeThreshold?: number;
}

export function useTouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  threshold = 50,
  timeThreshold = 300
}: SwipeHandler) {
  const [touchState, setTouchState] = useState<TouchState | null>(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const newTouchState: TouchState = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      currentX: touch.clientX,
      currentY: touch.clientY,
    };
    setTouchState(newTouchState);

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress();
      }, 500);
    }
  }, [onLongPress]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState) return;

    const touch = e.touches[0];
    setTouchState(prev => prev ? {
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    } : null);

    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      const deltaX = Math.abs(touch.clientX - touchState.startX);
      const deltaY = Math.abs(touch.clientY - touchState.startY);
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, [touchState]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchState) return;

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const deltaTime = Date.now() - touchState.startTime;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check for swipe gestures
    if (deltaTime < timeThreshold && (absDeltaX > threshold || absDeltaY > threshold)) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    } else if (absDeltaX < 10 && absDeltaY < 10 && deltaTime < timeThreshold) {
      // Tap gesture
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTapTime;

      if (timeDiff < 300 && onDoubleTap) {
        // Double tap
        onDoubleTap();
        setLastTapTime(0); // Reset to prevent triple tap
      } else if (onTap) {
        // Single tap
        setLastTapTime(currentTime);
        setTimeout(() => {
          // Only trigger single tap if no double tap occurred
          if (Date.now() - currentTime >= 300) {
            onTap();
          }
        }, 300);
      }
    }

    setTouchState(null);
  }, [touchState, lastTapTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, threshold, timeThreshold]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

// Hook for detecting device capabilities
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    hasHover: false,
    prefersDarkMode: false,
  });

  useState(() => {
    if (typeof window !== 'undefined') {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const userAgent = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isMobile = isTouchDevice && (isIOS || isAndroid);
      const hasHover = window.matchMedia('(hover: hover)').matches;
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

      setCapabilities({
        isTouchDevice,
        isIOS,
        isAndroid,
        isMobile,
        hasHover,
        prefersDarkMode,
      });
    }
  });

  return capabilities;
}

// Hook for haptic feedback on supported devices
export function useHapticFeedback() {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      // Web Vibration API
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  return { triggerHaptic };
}
