import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, FAB, Portal, Surface, Text, TextInput } from 'react-native-paper';
import { Colors } from '../constants/Colors';
import { User } from '../types';

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [editedUser, setEditedUser] = useState({ name: '', username: '', password: '' });
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to fetch users
      const mockUsers: User[] = [
        { id: '1', name: 'Test User 1', username: 'testuser1' },
        { id: '2', name: 'Test User 2', username: 'testuser2' },
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
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
    });
    setIsEditModalVisible(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogVisible(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // TODO: Implement API call to update user
      const updatedUsers = users.map(user =>
        user.id === selectedUser.id
          ? { ...user, name: editedUser.name, username: editedUser.username }
          : user
      );
      setUsers(updatedUsers);
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      // TODO: Implement API call to delete user
      const filteredUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(filteredUsers);
      setIsDeleteDialogVisible(false);
    } catch (error) {
      console.error('Error deleting user:', error);
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
                  <Text variant="titleMedium" style={styles.userName}>{user.name}</Text>
                  <Text variant="bodyMedium" style={styles.userUsername}>@{user.username}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() => handleEditUser(user)}
                  icon="pencil"
                  style={styles.editButton}
                >
                  Düzenle
                </Button>
                <Button
                  mode="text"
                  onPress={() => handleDeleteUser(user)}
                  icon="delete"
                  textColor={Colors.error}
                >
                  Sil
                </Button>
              </View>
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
  userName: {
    fontWeight: '600',
    color: Colors.text,
  },
  userUsername: {
    color: Colors.textLight,
    marginTop: 2,
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
