import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, Modal, Portal, Searchbar, Text, TextInput } from 'react-native-paper';
import { Colors } from '../../constants/Colors';
import { locationService } from '../../services/api';
import { Location, LocationType } from '../../types';

export default function MarkersScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<LocationType>('WETLAND');
  const [saving, setSaving] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [loading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await locationService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLocations = locations.filter((location) => {
    const matchesSearch = searchQuery
      ? location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (location.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      : true;
    const matchesType = selectedType ? location.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setEditTitle(location.title);
    setEditDescription(location.description || '');
    setEditType(location.type);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedLocation || !editTitle) return;

    try {
      setSaving(true);
      await locationService.updateLocation(selectedLocation.id, {
        title: editTitle,
        description: editDescription,
        type: editType,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        city: selectedLocation.city,
      });
      await fetchLocations();
      setEditModalVisible(false);
      resetEditForm();
    } catch (error) {
      console.error('Error updating location:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!selectedLocation) return;

    Alert.alert(
      'Konumu Sil',
      'Bu konumu silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await locationService.deleteLocation(selectedLocation.id);
              await fetchLocations();
              setEditModalVisible(false);
              resetEditForm();
            } catch (error) {
              console.error('Error deleting location:', error);
            } finally {
              setSaving(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const resetEditForm = () => {
    setSelectedLocation(null);
    setEditTitle('');
    setEditDescription('');
    setEditType('WETLAND');
  };

  const renderLocationCard = ({ item }: { item: Location }) => (
    <Card
      style={styles.card}
      mode="elevated"
      onPress={() => handleEditLocation(item)}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: item.type === 'WETLAND' ? Colors.secondary : Colors.primary }
          ]}>
            <MaterialCommunityIcons
              name={item.type === 'WETLAND' ? 'water' : 'warehouse'}
              size={20}
              color={Colors.white}
            />
          </View>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {item.title}
          </Text>
        </View>

        {item.description ? (
          <Text variant="bodyMedium" style={styles.description}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.coordinates}>
          <View style={styles.coordinateItem}>
            <MaterialCommunityIcons name="latitude" size={16} color={Colors.textLight} />
            <Text variant="bodySmall" style={styles.coordinateText}>
              {item.latitude.toFixed(4)}
            </Text>
          </View>
          <View style={styles.coordinateItem}>
            <MaterialCommunityIcons name="longitude" size={16} color={Colors.textLight} />
            <Text variant="bodySmall" style={styles.coordinateText}>
              {item.longitude.toFixed(4)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Konum ara..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={Colors.textLight}
          placeholderTextColor={Colors.textLight}
        />
        <View style={styles.filterContainer}>
          <Chip
            selected={selectedType === null}
            onPress={() => setSelectedType(null)}
            style={styles.filterChip}
            showSelectedOverlay
            elevation={1}
          >
            Tümü
          </Chip>
          <Chip
            selected={selectedType === 'WETLAND'}
            onPress={() => setSelectedType('WETLAND')}
            style={styles.filterChip}
            showSelectedOverlay
            elevation={1}
          >
            Sulak Alan
          </Chip>
          <Chip
            selected={selectedType === 'STORAGE'}
            onPress={() => setSelectedType('STORAGE')}
            style={styles.filterChip}
            showSelectedOverlay
            elevation={1}
          >
            Depo
          </Chip>
        </View>
      </View>

      <Divider style={styles.divider} />

      <FlatList
        data={filteredLocations}
        renderItem={renderLocationCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <MaterialCommunityIcons
                  name="loading"
                  size={48}
                  color={Colors.textLight}
                />
              </Animated.View>
            ) : (
              <MaterialCommunityIcons
                name="map-marker-off"
                size={48}
                color={Colors.textLight}
              />
            )}
            <Text variant="bodyLarge" style={styles.emptyText}>
              {loading ? 'Yükleniyor...' : 'Konum bulunamadı'}
            </Text>
          </View>
        }
      />

      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text variant="titleLarge" style={styles.modalTitle}>
                Konum Düzenle
              </Text>
              <View style={styles.modalContent}>
                <TextInput
                  label="Başlık"
                  value={editTitle}
                  onChangeText={setEditTitle}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Açıklama"
                  value={editDescription}
                  onChangeText={setEditDescription}
                  mode="outlined"
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.coordinates}>
                  <TextInput
                    label="Enlem"
                    value={selectedLocation?.latitude.toString()}
                    disabled
                    mode="outlined"
                    style={styles.coordinateInput}
                  />
                  <TextInput
                    label="Boylam"
                    value={selectedLocation?.longitude.toString()}
                    disabled
                    mode="outlined"
                    style={styles.coordinateInput}
                  />
                </View>
                <View style={styles.typeSelection}>
                  <Text variant="bodyMedium" style={styles.typeLabel}>Konum Türü</Text>
                  <View style={styles.typeButtons}>
                    <Button
                      mode={editType === 'WETLAND' ? 'contained' : 'outlined'}
                      onPress={() => setEditType('WETLAND')}
                      style={[
                        styles.typeButton,
                        editType === 'WETLAND' && { backgroundColor: Colors.secondary }
                      ]}
                      icon="water"
                      contentStyle={styles.typeButtonContent}
                    >
                      Sulak Alan
                    </Button>
                    <Button
                      mode={editType === 'STORAGE' ? 'contained' : 'outlined'}
                      onPress={() => setEditType('STORAGE')}
                      style={[
                        styles.typeButton,
                        editType === 'STORAGE' && { backgroundColor: Colors.primary }
                      ]}
                      icon="warehouse"
                      contentStyle={styles.typeButtonContent}
                    >
                      Depo
                    </Button>
                  </View>
                </View>
                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={handleDelete}
                    style={styles.deleteButton}
                    textColor={Colors.error}
                    loading={saving}
                    disabled={saving}
                  >
                    Sil
                  </Button>
                  <View style={styles.rightButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setEditModalVisible(false)}
                      style={styles.cancelButton}
                    >
                      İptal
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSaveEdit}
                      loading={saving}
                      disabled={saving || !editTitle}
                      style={styles.submitButton}
                    >
                      Kaydet
                    </Button>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 0,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    backgroundColor: Colors.white,
  },
  divider: {
    backgroundColor: Colors.border,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    color: Colors.text,
    fontWeight: '600',
  },
  description: {
    color: Colors.textLight,
  },
  coordinates: {
    flexDirection: 'row',
    gap: 16,
  },
  coordinateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordinateText: {
    color: Colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    color: Colors.textLight,
  },
  modal: {
    backgroundColor: Colors.white,
    padding: 24,
    marginHorizontal: 20,
    marginVertical: Platform.OS === 'ios' ? 40 : 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    color: Colors.primary,
    marginBottom: 20,
    fontWeight: '600',
  },
  modalContent: {
    gap: 16,
  },
  input: {
    backgroundColor: Colors.white,
  },
  typeSelection: {
    gap: 8,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
  },
  typeLabel: {
    color: Colors.textLight,
    marginLeft: 4,
    marginBottom: 4,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    borderRadius: 8,
  },
  typeButtonContent: {
    height: 44,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
  cancelButton: {
    borderColor: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    minWidth: 100,
  },
  coordinateInput: {
    flex: 1,
    backgroundColor: Colors.white,
  },
});
