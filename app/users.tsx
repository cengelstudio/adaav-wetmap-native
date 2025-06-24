import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { ActivityIndicator, Button, Dialog, FAB, Portal, Surface, Text, TextInput } from 'react-native-paper';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { User, UserRole } from '../types';
import NetInfo from '@react-native-community/netinfo';

// Safe console log function
const safeLog = (message: string, data?: any) => {
  try {
    console.log(message, data);
  } catch (error) {
    console.log(message, 'Data logging failed');
  }
};

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [editedUser, setEditedUser] = useState({ name: '', username: '', password: '', role: 'AUTHORIZED_PERSON' as UserRole });
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const checkNetworkAndFetchUsers = useCallback(async () => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert(
        'İnternet Bağlantısı Yok',
        'Kullanıcıları görüntülemek için internet bağlantısı gereklidir.',
        [
          {
            text: 'Geri Dön',
            onPress: () => router.back(),
          },
        ]
      );
      return;
    }
    fetchUsers();
  }, [router]);

  useEffect(() => {
    checkNetworkAndFetchUsers();
  }, [checkNetworkAndFetchUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      safeLog('[Users] Fetching users...');
      const fetchedUsers = await userService.getUsers();
      safeLog('[Users] Fetched users:', fetchedUsers);
      setUsers(fetchedUsers);
    } catch (error) {
      safeLog('[Users] Error fetching users:', error);
      Alert.alert('Hata', 'Kullanıcılar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditedUser({
      name: user.name,
      username: user.username,
      password: '',
      role: user.role,
    });
    setIsEditModalVisible(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // Check internet connection
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert(
        'İnternet Bağlantısı Yok',
        'Kullanıcı güncellemek için internet bağlantısı gereklidir.',
        [{ text: 'Tamam', style: 'default' }]
      );
      return;
    }

    try {
      const updatedUser = await userService.updateUser(selectedUser.id, editedUser);
      const updatedUsers = users.map(user =>
        user.id === selectedUser.id ? updatedUser : user
      );
      setUsers(updatedUsers);
      setIsEditModalVisible(false);
      Alert.alert('Başarılı', 'Kullanıcı başarıyla güncellendi.');
    } catch (error) {
      safeLog('[Users] Error updating user:', error);
      Alert.alert('Hata', 'Kullanıcı güncellenirken bir hata oluştu.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    // Check internet connection
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert(
        'İnternet Bağlantısı Yok',
        'Kullanıcı silmek için internet bağlantısı gereklidir.',
        [{ text: 'Tamam', style: 'default' }]
      );
      return;
    }

    try {
      await userService.deleteUser(selectedUser.id);
      const filteredUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(filteredUsers);
      setIsDeleteDialogVisible(false);
      Alert.alert('Başarılı', 'Kullanıcı başarıyla silindi.');
    } catch (error) {
      safeLog('[Users] Error deleting user:', error);
      Alert.alert('Hata', 'Kullanıcı silinirken bir hata oluştu.');
    }
  };

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case 'FEDERATION_OFFICER':
        return 'Federasyon Görevlisi';
      case 'STATE_OFFICER':
        return 'Devlet Görevlisi';
      default:
        return 'Yetkili Kişi';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.white,
          headerTitle: 'Kullanıcı Yönetimi',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {users.map(user => (
          <Surface key={user.id} style={styles.userCard} elevation={2}>
            <View style={styles.userInfo}>
              <View style={styles.userHeader}>
                <View style={styles.userAvatar}>
                  <MaterialCommunityIcons
                    name="account"
                    size={32}
                    color={Colors.white}
                  />
                </View>
                <View style={styles.userDetails}>
                  <View style={styles.nameContainer}>
                    <Text variant="titleMedium" style={styles.userName}>{user.name}</Text>
                    {user.isAdmin && (
                      <View style={styles.adminBadge}>
                        <MaterialCommunityIcons name="shield-check" size={16} color={Colors.white} />
                        <Text style={styles.adminText}>Admin</Text>
                      </View>
                    )}
                  </View>
                  <Text variant="bodyMedium" style={styles.userUsername}>@{user.username}</Text>
                  <View style={styles.roleChip}>
                    <Text variant="bodySmall" style={styles.roleText}>
                      {getRoleText(user.role)}
                    </Text>
                  </View>
                </View>
              </View>
              {(currentUser?.id === '1' || currentUser?.id === '2' || currentUser?.id === '3') && (
                <View style={styles.actions}>
                  <Button
                    mode="outlined"
                    onPress={() => handleEditUser(user)}
                    icon="pencil"
                    style={styles.editButton}
                  >
                    Düzenle
                  </Button>
                  {user.id !== currentUser.id && (
                    <Button
                      mode="text"
                      onPress={() => handleDeleteUser(user)}
                      icon="delete"
                      textColor={Colors.error}
                    >
                      Sil
                    </Button>
                  )}
                </View>
              )}
            </View>
          </Surface>
        ))}
      </ScrollView>

      <Portal>
        <Dialog visible={isDeleteDialogVisible} onDismiss={() => setIsDeleteDialogVisible(false)}>
          <Dialog.Title>Kullanıcıyı Sil</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {selectedUser?.name} kullanıcısını silmek istediğinizden emin misiniz?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsDeleteDialogVisible(false)}>İptal</Button>
            <Button onPress={handleConfirmDelete} textColor={Colors.error}>Sil</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={isEditModalVisible} onDismiss={() => setIsEditModalVisible(false)}>
          <Dialog.Title>Kullanıcıyı Düzenle</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="İsim"
              value={editedUser.name}
              onChangeText={(text) => setEditedUser(prev => ({ ...prev, name: text }))}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Kullanıcı Adı"
              value={editedUser.username}
              onChangeText={(text) => setEditedUser(prev => ({ ...prev, username: text }))}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Yeni Şifre (opsiyonel)"
              value={editedUser.password}
              onChangeText={(text) => setEditedUser(prev => ({ ...prev, password: text }))}
              mode="outlined"
              style={styles.input}
              secureTextEntry
            />
            <TextInput
              label="Rol"
              value={getRoleText(editedUser.role)}
              mode="outlined"
              style={styles.input}
              disabled
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsEditModalVisible(false)}>İptal</Button>
            <Button onPress={handleUpdateUser} mode="contained">Güncelle</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="arrow-left"
        style={styles.fab}
        onPress={() => router.back()}
        color={Colors.white}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  userInfo: {
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontWeight: '600',
    color: Colors.text,
  },
  userUsername: {
    color: Colors.textLight,
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  roleChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleText: {
    color: Colors.textLight,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    borderColor: Colors.primary,
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.white,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    left: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
  },
});
