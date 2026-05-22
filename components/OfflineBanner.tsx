import { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      Animated.timing(translateY, {
        toValue: offline ? 0 : -60,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    return unsub;
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        backgroundColor: '#ef4444',
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 14 }}>📡</Text>
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>
        No internet connection
      </Text>
    </Animated.View>
  );
}