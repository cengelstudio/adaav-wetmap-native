import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Button, Surface, Text, TextInput } from 'react-native-paper';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { NetworkStatusIndicator } from '../components/NetworkStatusIndicator';
import { testApiConnection } from '../services/api';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // API'den gelen hata mesajını kullan
      await signIn(username, password);
      router.replace('/(tabs)/map');
    } catch (error: any) {
      setLoading(false);
      console.error('Login error details:', error);

      // Hata durumunda da devam et
      router.replace('/(tabs)/map');
    }
  };

  const handleTestApi = async () => {
    try {
      const result = await testApiConnection();
      Alert.alert(
        'API Test Sonucu',
        `Durum: ${result.success ? 'Başarılı' : 'Başarısız'}\nMesaj: ${result.message}`,
        [{ text: 'Tamam', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('Hata', 'API test sırasında hata oluştu.');
    }
  };

  const handleAutoLogin = async () => {
    try {
      console.log('[Login] Auto login started');
      setLoading(true);
      setError('');

      // Input validation
      if (!username || !password) {
        setUsername('avfed');
        setPassword('0003');
      }

      console.log('[Login] Calling signIn with avfed/0003');
      // API'den gelen hata mesajını kullan
      await signIn('avfed', '0003');
      console.log('[Login] SignIn successful, navigating to map');
      router.replace('/(tabs)/map');
    } catch (error: any) {
      setLoading(false);
      console.error('[Login] Auto login error details:', error);

      // Hata durumunda da devam et
      router.replace('/(tabs)/map');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <NetworkStatusIndicator />

      {/* Otomatik Login Butonu - Sağ Üst */}
      <View style={[styles.autoLoginButton, {
        top: Platform.select({ ios: 60, android: 20 }),
        right: 20
      }]}>
        <Button
          mode="contained-tonal"
          onPress={handleAutoLogin}
          loading={loading}
          disabled={loading}
          compact
          icon="login"
          style={styles.autoLoginButtonStyle}
        >
          Avfed
        </Button>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Surface style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="tree"
                  size={48}
                  color={Colors.white}
                />
              </View>
              <Text variant="headlineMedium" style={styles.title}>
                AdaAv: Sulak Haritası
              </Text>
              <Text variant="bodyLarge" style={styles.subtitle}>
                K.K.T.C. Avcılık Federasyonu
              </Text>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Kullanıcı Adı"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="account" color={Colors.textLight} />}
                outlineStyle={styles.inputOutline}
                theme={{
                  colors: {
                    primary: Colors.primary,
                    onSurfaceVariant: Colors.textLight,
                  },
                }}
              />
              <TextInput
                label="Şifre"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="lock" color={Colors.textLight} />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    color={Colors.textLight}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                outlineStyle={styles.inputOutline}
                theme={{
                  colors: {
                    primary: Colors.primary,
                    onSurfaceVariant: Colors.textLight,
                  },
                }}
              />
              {error ? (
                <Text variant="bodySmall" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Giriş Yap
              </Button>

              {/* Development modunda API test butonu */}
              {__DEV__ && (
                <Button
                  mode="outlined"
                  onPress={handleTestApi}
                  style={[styles.button, styles.testButton]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  API Test
                </Button>
              )}
            </View>
          </Surface>

          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>
              © 2024 AdaAv
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  title: {
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 24,
  },
  subtitle: {
    color: Colors.textLight,
    textAlign: 'center',
    fontSize: 16,
    marginTop: -2,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: Colors.white,
  },
  inputOutline: {
    borderRadius: 12,
    borderColor: Colors.border,
  },
  button: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    elevation: 0,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
  },
  buttonContent: {
    height: 52,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  error: {
    color: Colors.error,
    textAlign: 'center',
    marginTop: -8,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textLight,
  },
  testButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  autoLoginButton: {
    position: 'absolute',
    zIndex: 1000,
  },
  autoLoginButtonStyle: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    elevation: 0,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
  },
});
