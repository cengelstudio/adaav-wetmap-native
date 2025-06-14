import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      await signIn(username, password);
      router.replace('/(tabs)/map');
    } catch (err) {
      setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="tree"
                size={64}
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
              secureTextEntry
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="lock" color={Colors.textLight} />}
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
          </View>

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
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
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
    marginBottom: 8,
    fontSize: 28,
  },
  subtitle: {
    color: Colors.textLight,
    textAlign: 'center',
    fontSize: 18,
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
    marginTop: 8,
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
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  error: {
    color: Colors.error,
    textAlign: 'center',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textLight,
  },
});
