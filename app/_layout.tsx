import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NetworkProvider } from '../context/NetworkContext';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import { LogBox } from 'react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Splash screen'i otomatik gizlemeyi engelle
SplashScreen.preventAutoHideAsync();

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

// Define the background task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Here you would implement the actual sync logic
    // For example, check AsyncStorage for pending actions and sync them
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Crash önleme için error handling
const handleError = (error: Error, isFatal?: boolean) => {
  console.log('Error caught:', error);
  // Crash'i engelle, sadece log'la
};

// iOS için crash önleme
if (__DEV__) {
  LogBox.ignoreLogs(['Warning:']); // Warning'leri görmezden gel
}

function RootLayoutNav() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Auth yüklemesi tamamlandığında splash screen'i gizle
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  useEffect(() => {
    // Request notification permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    };

    requestPermissions();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal'
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Global error handler
    const errorHandler = (error: Error, isFatal?: boolean) => {
      handleError(error, isFatal);
    };

    // Error listener'ı ekle
    if ((global as any).ErrorUtils) {
      (global as any).ErrorUtils.setGlobalHandler(errorHandler);
    }

    return () => {
      // Cleanup
      if ((global as any).ErrorUtils) {
        (global as any).ErrorUtils.setGlobalHandler(null);
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NetworkProvider>
          <PaperProvider>
            <ErrorBoundary>
              <RootLayoutNav />
            </ErrorBoundary>
          </PaperProvider>
        </NetworkProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
