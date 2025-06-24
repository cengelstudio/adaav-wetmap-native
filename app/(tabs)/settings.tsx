import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Avatar, Button, Divider, Modal, Portal, Surface, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { userService } from '../../services/api';
import NetInfo from '@react-native-community/netinfo';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { isConnected } = useNetwork();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'AUTHORIZED_PERSON' });

  console.log('[Settings] Current user:', user);
  console.log('[Settings] Network status:', { isConnected });

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleHelp = async () => {
    await Linking.openURL('mailto:cyprus@metehansaral.com');
  };

  const handleAddUser = async () => {
    // Check internet connection
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert(
        'İnternet Bağlantısı Yok',
        'Kullanıcı eklemek için internet bağlantısı gereklidir.',
        [{ text: 'Tamam', style: 'default' }]
      );
      return;
    }

    try {
      await userService.createUser(newUser);
      setNewUser({ name: '', username: '', password: '', role: 'AUTHORIZED_PERSON' });
      setIsAddUserModalVisible(false);
      Alert.alert('Başarılı', 'Kullanıcı başarıyla eklendi.');
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Hata', 'Kullanıcı eklenirken bir hata oluştu.');
    }
  };

  const handleNavigateToUsers = async () => {
    // Check internet connection
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert(
        'İnternet Bağlantısı Yok',
        'Kullanıcıları görüntülemek için internet bağlantısı gereklidir.',
        [{ text: 'Tamam', style: 'default' }]
      );
      return;
    }

    router.push('/users');
  };

  const renderSettingItem = (icon: IconName, title: string, subtitle?: string, onPress?: () => void, disabled?: boolean) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.settingItem,
        pressed && !disabled && { backgroundColor: Colors.background },
        disabled && styles.disabledItem
      ]}
    >
      <View style={[styles.settingIconContainer, disabled && styles.disabledIcon]}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={disabled ? Colors.textLight : Colors.primary}
        />
      </View>
      <View style={styles.settingText}>
        <Text variant="bodyLarge" style={[styles.settingTitle, disabled && styles.disabledText]}>{title}</Text>
        {subtitle && <Text variant="bodySmall" style={[styles.settingSubtitle, disabled && styles.disabledText]}>{subtitle}</Text>}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={disabled ? Colors.textLight : Colors.textLight}
      />
    </Pressable>
  );

  // Check if user is admin and has internet connection
  const isAdmin = user?.id === '1' || user?.id === '2' || user?.id === '3';
  const canAccessAdmin = isAdmin && isConnected;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: Platform.select({ ios: 0, android: insets.top }),
          paddingBottom: insets.bottom + 20
        }
      ]}
    >
      <Surface style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar.Icon
            size={72}
            icon="account"
            style={styles.avatar}
            color={Colors.white}
          />
          <View style={styles.profileInfo}>
            <Text variant="titleLarge" style={styles.name}>{user?.name}</Text>
            <View style={styles.roleChip}>
              <MaterialCommunityIcons name="shield-account" size={16} color={Colors.primary} />
              <Text variant="bodySmall" style={styles.roleText}>
                {user?.role === 'FEDERATION_OFFICER'
                  ? 'Federasyon Görevlisi'
                  : user?.role === 'STATE_OFFICER'
                  ? 'Devlet Görevlisi'
                  : 'Yetkili Kişi'}
              </Text>
            </View>
            {!isConnected && (
              <View style={styles.offlineIndicator}>
                <MaterialCommunityIcons name="wifi-off" size={14} color={Colors.warning} />
                <Text variant="bodySmall" style={styles.offlineText}>Çevrimdışı mod</Text>
              </View>
            )}
          </View>
        </View>
      </Surface>

      {isAdmin && (
        <>
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Yönetim</Text>
            <Surface style={styles.sectionCard}>
              {renderSettingItem(
                'account-plus',
                'Yeni Kullanıcı',
                canAccessAdmin ? 'Yeni kullanıcı ekle' : 'İnternet bağlantısı gerekli',
                () => setIsAddUserModalVisible(true),
                !canAccessAdmin
              )}
              <Divider style={styles.itemDivider} />
              {renderSettingItem(
                'account-group',
                'Kullanıcılar',
                canAccessAdmin ? 'Kullanıcıları yönet' : 'İnternet bağlantısı gerekli',
                handleNavigateToUsers,
                !canAccessAdmin
              )}
            </Surface>
            {!isConnected && isAdmin && (
              <Text style={styles.offlineNote}>
                Yönetim işlemleri için internet bağlantısı gereklidir.
              </Text>
            )}
          </View>
        </>
      )}

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Uygulama</Text>
        <Surface style={styles.sectionCard}>
          {renderSettingItem('information', 'Hakkında', 'Versiyon 1.0.0')}
          <Divider style={styles.itemDivider} />
          {renderSettingItem('help-circle', 'Yardım', 'Destek için iletişime geçin', handleHelp)}
        </Surface>
      </View>

      <Button
        mode="contained-tonal"
        onPress={handleLogout}
        style={styles.logoutButton}
        contentStyle={styles.logoutButtonContent}
        icon="logout"
        theme={{ colors: { secondaryContainer: '#FFE5E5' }}}
        textColor="#FF3B30"
      >
        Çıkış Yap
      </Button>

      <Portal>
        <Modal
          visible={isAddUserModalVisible}
          onDismiss={() => setIsAddUserModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>Yeni Kullanıcı Ekle</Text>
            <TextInput
              label="İsim"
              value={newUser.name}
              onChangeText={(text) => setNewUser(prev => ({ ...prev, name: text }))}
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Kullanıcı Adı"
              value={newUser.username}
              onChangeText={(text) => setNewUser(prev => ({ ...prev, username: text }))}
              mode="outlined"
              style={styles.modalInput}
            />
            <TextInput
              label="Şifre"
              value={newUser.password}
              onChangeText={(text) => setNewUser(prev => ({ ...prev, password: text }))}
              mode="outlined"
              secureTextEntry
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setIsAddUserModalVisible(false)}
                style={styles.modalButton}
              >
                İptal
              </Button>
              <Button
                mode="contained"
                onPress={handleAddUser}
                style={[styles.modalButton, styles.modalSubmitButton]}
              >
                Ekle
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 16,
    backgroundColor: Colors.white,
    marginBottom: 24,
    overflow: 'hidden',
    elevation: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  },
  profileHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: Colors.primary,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    color: Colors.text,
    fontSize: 20,
    marginBottom: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.select({
      ios: 'rgba(0,122,255,0.1)',
      android: Colors.background,
    }),
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 0,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: Colors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.textLight,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 15,
  },
  sectionCard: {
    borderRadius: 16,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    elevation: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Platform.select({
      ios: 'rgba(0,122,255,0.1)',
      android: Colors.background,
    }),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: Colors.text,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: Colors.textLight,
    marginTop: 2,
  },
  itemDivider: {
    backgroundColor: Colors.border,
    height: 0.5,
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  logoutButtonContent: {
    height: 48,
  },
  modalContainer: {
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.text,
    fontWeight: '600',
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
  },
  modalSubmitButton: {
    backgroundColor: Colors.primary,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Platform.select({
      ios: 'rgba(255,255,255,0.8)',
      android: Colors.background,
    }),
    borderRadius: 8,
    marginTop: 8,
  },
  offlineText: {
    color: Colors.warning,
    marginLeft: 6,
    fontWeight: '500',
  },
  offlineNote: {
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledIcon: {
    backgroundColor: Colors.background,
  },
  disabledText: {
    color: Colors.textLight,
  },
});
