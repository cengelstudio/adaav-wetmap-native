import React, { useEffect, useState } from 'react';
import { Link, Stack, router } from 'expo-router';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.replace('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sayfa Bulunamadı' }} />
      <View style={styles.container}>
        <Text style={styles.title}>
          Sayfa Bulunamadı
        </Text>

        <Text style={styles.description}>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleGoHome}>
          <Text style={styles.buttonText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>

        <Text style={styles.countdown}>
          {countdown > 0 ? `${countdown} saniye sonra ana sayfaya yönlendirileceksiniz...` : 'Yönlendiriliyor...'}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#000',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  countdown: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    color: '#666',
  },
});
