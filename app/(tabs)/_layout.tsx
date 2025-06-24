import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: Platform.select({ ios: '#D1D1D6', android: Colors.border }),
          backgroundColor: Platform.select({ ios: 'rgba(255,255,255,0.95)', android: Colors.white }),
          height: Platform.select({
            ios: 88 + insets.bottom,
            android: 64 + insets.bottom
          }),
          paddingBottom: Platform.select({
            ios: insets.bottom,
            android: insets.bottom
          }),
          paddingTop: Platform.select({ ios: 8, android: 8 }),
          elevation: Platform.select({ ios: 0, android: 8 }),
          shadowColor: Platform.select({ ios: '#000', android: '#000' }),
          shadowOffset: Platform.select({
            ios: { width: 0, height: -2 },
            android: { width: 0, height: -2 }
          }),
          shadowOpacity: Platform.select({ ios: 0.1, android: 0.1 }),
          shadowRadius: Platform.select({ ios: 4, android: 4 }),
        },
        headerStyle: {
          backgroundColor: Colors.white,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        headerTitleStyle: {
          color: Colors.text,
          fontSize: 17,
          fontWeight: '600',
        },
        headerTintColor: Colors.primary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: Platform.select({ ios: 0, android: 2 }),
        },
        tabBarIconStyle: {
          marginTop: Platform.select({ ios: 4, android: 0 }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Harita',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="markers"
        options={{
          title: 'Konumlar',
          headerTitle: 'Konumlar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-multiple" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          headerTitle: 'Hesap Ayarları',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
