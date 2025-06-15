import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Modal, Portal, Searchbar, Surface, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { locationService } from '../../services/api';
import { Location, LocationType } from '../../types';

export default function MarkersScreen() {
  const insets = useSafeAreaInsets();
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
    <Pressable
      onPress={() => handleEditLocation(item)}
      style={({ pressed }) => [
        styles.cardPressable,
        pressed && { opacity: 0.7 }
      ]}
    >
      <Surface style={styles.card} elevation={0}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: item.type === 'WETLAND' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)' }
            ]}>
              <MaterialCommunityIcons
                name={item.type === 'WETLAND' ? 'water' : 'warehouse'}
                size={22}
                color={item.type === 'WETLAND' ? Colors.secondary : Colors.primary}
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
      </Surface>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Surface style={styles.header} elevation={0}>
        <Searchbar
          placeholder="Konum ara..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={Colors.textLight}
          placeholderTextColor={Colors.textLight}
          elevation={0}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <Chip
            selected={selectedType === null}
            onPress={() => setSelectedType(null)}
            style={styles.filterChip}
            showSelectedOverlay
            elevation={0}
          >
            Tümü
          </Chip>
          <Chip
            selected={selectedType === 'WETLAND'}
            onPress={() => setSelectedType('WETLAND')}
            style={styles.filterChip}
            showSelectedOverlay
            elevation={0}
          >
            Sulak Alan
          </Chip>
          <Chip
            selected={selectedType === 'STORAGE'}
            onPress={() => setSelectedType('STORAGE')}
            style={styles.filterChip}
            showSelectedOverlay
            elevation={0}
          >
            Depo
          </Chip>
        </ScrollView>
      </Surface>

      <FlatList
        data={filteredLocations}
        renderItem={renderLocationCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 }
        ]}
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
              <>
                <MaterialCommunityIcons
                  name="map-marker-off"
                  size={48}
                  color={Colors.textLight}
                />
                <Text style={styles.emptyText}>Konum bulunamadı</Text>
              </>
            )}
          </View>
        }
      />

      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                Konum Düzenle
              </Text>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={Colors.textLight}
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              />
            </View>

            <View style={styles.modalForm}>
              <TextInput
                label="Başlık"
                value={editTitle}
                onChangeText={setEditTitle}
                mode="outlined"
                style={styles.modalInput}
              />
              <TextInput
                label="Açıklama"
                value={editDescription}
                onChangeText={setEditDescription}
                mode="outlined"
                style={styles.modalInput}
                multiline
                numberOfLines={3}
              />

              <Text variant="bodyMedium" style={styles.modalLabel}>Konum Türü</Text>
              <View style={styles.modalChips}>
                <Chip
                  selected={editType === 'WETLAND'}
                  onPress={() => setEditType('WETLAND')}
                  style={[styles.modalChip, { backgroundColor: editType === 'WETLAND' ? 'rgba(52, 199, 89, 0.1)' : Colors.background }]}
                  textStyle={{ color: editType === 'WETLAND' ? Colors.secondary : Colors.textLight }}
                  showSelectedOverlay
                >
                  Sulak Alan
                </Chip>
                <Chip
                  selected={editType === 'STORAGE'}
                  onPress={() => setEditType('STORAGE')}
                  style={[styles.modalChip, { backgroundColor: editType === 'STORAGE' ? 'rgba(0, 122, 255, 0.1)' : Colors.background }]}
                  textStyle={{ color: editType === 'STORAGE' ? Colors.primary : Colors.textLight }}
                  showSelectedOverlay
                >
                  Depo
                </Chip>
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setEditModalVisible(false)}
                  style={styles.modalButton}
                >
                  İptal
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveEdit}
                  style={[styles.modalButton, styles.modalSubmitButton]}
                  loading={saving}
                  disabled={saving}
                >
                  Kaydet
                </Button>
              </View>

              <Button
                mode="contained-tonal"
                onPress={handleDelete}
                style={styles.deleteButton}
                textColor="#FF3B30"
                theme={{ colors: { secondaryContainer: '#FFE5E5' }}}
                icon="delete"
              >
                Konumu Sil
              </Button>
            </View>
          </Surface>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    backgroundColor: Platform.select({
      ios: 'rgba(142,142,147,0.12)',
      android: Colors.background,
    }),
    borderRadius: 12,
    marginBottom: 12,
    elevation: 0,
    height: 40,
  },
  searchInput: {
    fontSize: 16,
    minHeight: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
    gap: 8,
    marginTop: -4,
  },
  filterChip: {
    backgroundColor: Colors.background,
    borderRadius: 16,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
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
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
    color: Colors.text,
    fontWeight: '600',
  },
  description: {
    color: Colors.textLight,
    marginBottom: 12,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: Colors.textLight,
    marginTop: 12,
    fontSize: 16,
  },
  modalContainer: {
    padding: 20,
    margin: 0,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.text,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalForm: {
    padding: 24,
  },
  modalLabel: {
    color: Colors.textLight,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalInput: {
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  modalChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  modalChip: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
  },
  modalSubmitButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    borderRadius: 12,
  },
  cardPressable: {
    marginHorizontal: 1,
    marginVertical: 1,
  },
});
