import '@testing-library/jest-native/extend-expect';

// react-native-gesture-handler recommends this import for Jest environments
import 'react-native-gesture-handler/jestSetup';

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Reanimated mock (required by many Expo Router + RN setups)
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, { ...props, testID: props.testID ?? 'expo-image' }),
  };
});

jest.mock('expo-router', () => {
  return {
    Tabs: ({ children }: any) => children,
    Stack: ({ children }: any) => children,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    useSegments: () => ['(app)'],
    useLocalSearchParams: () => ({}),
  };
});

jest.mock('expo-notifications', () => {
  return {
    AndroidImportance: { DEFAULT: 3 },
    SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(async () => ({ granted: true })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
    scheduleNotificationAsync: jest.fn(async () => 'id'),
    cancelScheduledNotificationAsync: jest.fn(async () => undefined),
    setNotificationChannelAsync: jest.fn(async () => undefined),
  };
});

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: true, isInternetReachable: true })),
}));

