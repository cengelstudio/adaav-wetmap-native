import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Divider, Modal, Portal, Surface, Text, TextInput } from 'react-native-paper';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '' });

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleHelp = async () => {
    await Linking.openURL('mailto:cyprus@metehansaral.com');
  };

  const handleAddUser = () => {
    // TODO: Implement user creation logic
    setNewUser({ name: '', username: '', password: '' });
    setIsAddUserModalVisible(false);
  };

  const renderSettingItem = (icon: IconName, title: string, subtitle?: string, onPress?: () => void) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingItem,
        pressed && { opacity: 0.7 }
      ]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={Colors.primary} style={styles.settingIcon} />
      <View style={styles.settingText}>
        <Text variant="bodyLarge" style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text variant="bodySmall" style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textLight} />
    </Pressable>
  );

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Surface style={styles.profileCard} elevation={2}>
          <View style={styles.profileHeader}>
            <Avatar.Icon
              size={80}
              icon="account"
              style={styles.avatar}
              color={Colors.white}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.name}>{user?.name}</Text>
              <Text variant="bodyMedium" style={styles.email}>{user?.email}</Text>
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
            </View>
          </View>
        </Surface>

        {user?.id !== '1' && (
          <>
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Yönetim</Text>
              {renderSettingItem('account-plus', 'Yeni Kullanıcı', 'Yeni kullanıcı ekle', () => setIsAddUserModalVisible(true))}
              {renderSettingItem('account-group', 'Kullanıcılar', 'Kullanıcıları yönet', () => router.push('/users'))}
            </View>

            <Divider style={styles.divider} />
          </>
        )}

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Uygulama</Text>
          {renderSettingItem('information', 'Hakkında', 'Versiyon 1.0.0')}
          {renderSettingItem('help-circle', 'Yardım', 'Destek için iletişime geçin', handleHelp)}
        </View>

        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          icon="logout"
        >
          Çıkış Yap
        </Button>
      </ScrollView>

      <Portal>
        <Modal
          visible={isAddUserModalVisible}
          onDismiss={() => setIsAddUserModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
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
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 16,
    backgroundColor: Colors.white,
    marginBottom: 24,
    overflow: 'hidden',
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
  },
  email: {
    color: Colors.textLight,
    marginTop: 2,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 16,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingIcon: {
    marginRight: 16,
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
  divider: {
    marginVertical: 24,
    backgroundColor: Colors.border,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    marginTop: 8,
    marginBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  logoutButtonContent: {
    paddingVertical: 8,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 20,
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
  },
  modalButton: {
    minWidth: 100,
  },
  modalSubmitButton: {
    backgroundColor: Colors.primary,
  },
});
