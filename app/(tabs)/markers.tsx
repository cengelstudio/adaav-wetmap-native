import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Modal, Portal, Searchbar, Surface, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { locationService } from '../../services/api';
import { Location, LocationType } from '../../types';
import { useNetwork } from '../../context/NetworkContext';
import { offlineService } from '../../services/offlineService';
import NetInfo from '@react-native-community/netinfo';

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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: Platform.select({
      ios: 'rgba(142,142,147,0.12)',
      android: Colors.background,
    }),
    borderRadius: 12,
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
  emptySubText: {
    color: Colors.textLight,
    marginTop: 8,
    fontSize: 14,
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
  exportButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 40,
  },
  offlineCard: {
    backgroundColor: Colors.background,
  },
  offlineIcon: {
    marginLeft: 8,
  },
  offlineChip: {
    backgroundColor: Colors.background,
    borderRadius: 16,
  },
  offlineChipText: {
    color: Colors.textLight,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  offlineIndicatorText: {
    color: Colors.textLight,
  },
  syncButton: {
    padding: 0,
  },
  offlineModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  offlineModeText: {
    color: Colors.textLight,
  },
  debugButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  debugButton: {
    flex: 1,
  },
});

export default function MarkersScreen() {
  const insets = useSafeAreaInsets();
  const { isConnected, syncOfflineData, isSyncing } = useNetwork();
  const [locations, setLocations] = useState<Location[]>([]);
  const [offlineLocations, setOfflineLocations] = useState<Location[]>([]);
  const [selectedType, setSelectedType] = useState<LocationType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<LocationType>('WETLAND');
  const [saving, setSaving] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchLocations();
    fetchOfflineLocations();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchLocations();
      fetchOfflineLocations();
    }
  }, [isConnected]);

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
  }, [loading, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await locationService.getLocations();
      setLocations(data);
      console.log('[Markers] Locations fetched:', data.length);
    } catch (error) {
      console.error('[Markers] Error fetching locations:', error);
      // Don't show error to user, just set empty array
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfflineLocations = async () => {
    try {
      const data = await offlineService.getLocalLocations();
      setOfflineLocations(data);
      console.log('[Markers] Offline locations fetched:', data.length);
    } catch (error) {
      console.error('[Markers] Error fetching offline locations:', error);
      setOfflineLocations([]);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await locationService.getLocations();
      setLocations(data);
      await fetchOfflineLocations();
      console.log('[Markers] Refresh completed successfully');
    } catch (error) {
      console.error('[Markers] Error refreshing locations:', error);
      // Don't show error to user, just continue
    } finally {
      setRefreshing(false);
    }
  }, []);

  const allLocations = [...(locations || []), ...(offlineLocations || [])];

  const filteredLocations = allLocations.filter((location) => {
    const matchesSearch = searchQuery
      ? location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (location.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      : true;
    const matchesType = selectedType ? location.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  // Check if we're in offline mode
  const isOfflineMode = !isConnected || locations.length === 0;

  const handleEditLocation = (location: Location) => {
    const isOffline = location.id.startsWith('local_');

    if (isOffline) {
      Alert.alert(
        'Çevrimdışı Kayıt',
        'Bu kayıt henüz senkronize edilmemiş. Düzenlemek için önce senkronize edin.',
        [
          {
            text: 'Tamam',
            style: 'default',
          },
        ]
      );
      return;
    }

    setSelectedLocation(location);
    setEditTitle(location.title);
    setEditDescription(location.description || '');
    setEditType(location.type);
    setEditModalVisible(true);
  };

  const handleUpdateLocation = async () => {
    if (!selectedLocation) return;

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

    const isOffline = selectedLocation.id.startsWith('local_');

    Alert.alert(
      'Konumu Sil',
      isOffline
        ? 'Bu çevrimdışı kaydı silmek istediğinizden emin misiniz?'
        : 'Bu konumu silmek istediğinizden emin misiniz?',
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
              if (isOffline) {
                await offlineService.deleteLocalLocation(selectedLocation.id);
                await fetchOfflineLocations();
              } else {
                await locationService.deleteLocation(selectedLocation.id);
                await fetchLocations();
              }
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

  const handleSyncOfflineData = async () => {
    if (isSyncing) return;

    // Check internet connection
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert(
        'İnternet Bağlantısı Yok',
        'Senkronizasyon için internet bağlantısı gereklidir.',
        [{ text: 'Tamam', style: 'default' }]
      );
      return;
    }

    try {
      await syncOfflineData();
      await fetchLocations();
      await fetchOfflineLocations();
    } catch (error) {
      console.error('Error syncing offline data:', error);
      Alert.alert(
        'Senkronizasyon Hatası',
        'Veriler senkronize edilirken bir hata oluştu.',
        [{ text: 'Tamam', style: 'default' }]
      );
    }
  };

  const handleAddTestData = async () => {
    try {
      await offlineService.addTestLocations();
      await fetchOfflineLocations();
      Alert.alert(
        'Test Verileri Eklendi',
        '5 adet test konumu eklendi. Şimdi listeyi kontrol edin.',
        [{ text: 'Tamam', style: 'default' }]
      );
    } catch (error) {
      console.error('Error adding test data:', error);
      Alert.alert(
        'Hata',
        'Test verileri eklenirken bir hata oluştu.',
        [{ text: 'Tamam', style: 'default' }]
      );
    }
  };

  const handleCheckStorage = async () => {
    try {
      const status = await offlineService.checkStorageStatus();
      Alert.alert(
        'Storage Durumu',
        `Local konumlar: ${status.localCount}\nQueue: ${status.queueCount}`,
        [{ text: 'Tamam', style: 'default' }]
      );
    } catch (error) {
      console.error('Error checking storage:', error);
    }
  };

  const resetEditForm = () => {
    setSelectedLocation(null);
    setEditTitle('');
    setEditDescription('');
    setEditType('WETLAND');
  };

  const handleExportCSV = async () => {
    try {
      // Create CSV header
      const header = 'Başlık,Açıklama,Enlem,Boylam,Türü\n';

      // Create CSV rows
      const rows = filteredLocations.map(location => {
        const type = location.type === 'WETLAND' ? 'Sulak Alan' : 'Depo';
        return `"${location.title}","${location.description || ''}",${location.latitude},${location.longitude},"${type}"`;
      }).join('\n');

      // Combine header and rows
      const csvContent = header + rows;

      // Share the CSV file
      await Share.share({
        message: csvContent,
        title: 'Konumlar.csv',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Hata', 'CSV dosyası oluşturulurken bir hata oluştu.');
    }
  };

  const renderLocationCard = ({ item }: { item: Location }) => {
    const isOffline = item.id.startsWith('local_');

    return (
      <Pressable
        onPress={() => handleEditLocation(item)}
        style={({ pressed }) => [
          styles.cardPressable,
          pressed && { opacity: 0.7 }
        ]}
      >
        <Surface style={[styles.card, isOffline && styles.offlineCard]} elevation={0}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: isOffline ? 'rgba(255, 149, 0, 0.1)' : (item.type === 'WETLAND' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)') }
              ]}>
                <MaterialCommunityIcons
                  name={item.type === 'WETLAND' ? 'water' : 'warehouse'}
                  size={22}
                  color={isOffline ? Colors.warning : (item.type === 'WETLAND' ? Colors.secondary : Colors.primary)}
                />
              </View>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {item.title}
              </Text>
              {isOffline && (
                <MaterialCommunityIcons
                  name="wifi-off"
                  size={16}
                  color={Colors.warning}
                  style={styles.offlineIcon}
                />
              )}
            </View>

            {item.description ? (
              <Text variant="bodyMedium" style={styles.description}>
                {item.description}
              </Text>
            ) : null}

            {isOffline && (
              <Chip
                icon="wifi-off"
                style={styles.offlineChip}
                textStyle={styles.offlineChipText}
              >
                Çevrimdışı
              </Chip>
            )}

            <View style={styles.coordinates}>
              <View style={styles.coordinateItem}>
                <MaterialCommunityIcons name="latitude" size={16} color={Colors.textLight} />
                <Text style={styles.coordinateText}>{item.latitude.toFixed(4)}</Text>
              </View>
              <View style={styles.coordinateItem}>
                <MaterialCommunityIcons name="longitude" size={16} color={Colors.textLight} />
                <Text style={styles.coordinateText}>{item.longitude.toFixed(4)}</Text>
              </View>
            </View>
          </Card.Content>
        </Surface>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, {
      paddingTop: Platform.select({ ios: insets.top, android: 0 }),
      paddingBottom: Platform.select({ ios: 0, android: insets.bottom })
    }]}>
      <Surface style={styles.header} elevation={0}>
        <View style={styles.headerTop}>
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
          <Button
            mode="contained"
            onPress={handleExportCSV}
            style={styles.exportButton}
            icon="file-export"
          >
            CSV
          </Button>
        </View>

        {/* Offline mode indicator */}
        {isOfflineMode && (
          <View style={styles.offlineModeIndicator}>
            <MaterialCommunityIcons
              name="wifi-off"
              size={16}
              color={Colors.warning}
            />
            <Text style={styles.offlineModeText}>
              Çevrimdışı mod - Sadece yerel veriler gösteriliyor
            </Text>
          </View>
        )}

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
            selected={selectedType === 'DEPOT'}
            onPress={() => setSelectedType('DEPOT')}
            style={styles.filterChip}
            showSelectedOverlay
            elevation={0}
          >
            Depo
          </Chip>
        </ScrollView>

        {/* Offline sync indicator */}
        {offlineLocations.length > 0 && (
          <View style={styles.offlineIndicator}>
            <MaterialCommunityIcons
              name="wifi-off"
              size={16}
              color={Colors.warning}
            />
            <Text style={styles.offlineIndicatorText}>
              {offlineLocations.length} çevrimdışı kayıt
            </Text>
            {isConnected && (
              <Button
                mode="text"
                onPress={handleSyncOfflineData}
                disabled={isSyncing}
                loading={isSyncing}
                compact
                style={styles.syncButton}
                textColor={Colors.primary}
              >
                {isSyncing ? 'Senkronize Ediliyor...' : 'Senkronize Et'}
              </Button>
            )}
          </View>
        )}
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
        refreshing={refreshing}
        onRefresh={onRefresh}
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
                <Text style={styles.emptyText}>
                  {isOfflineMode
                    ? 'Çevrimdışı modda konum bulunamadı'
                    : 'Konum bulunamadı'
                  }
                </Text>
                {isOfflineMode && (
                  <Text style={styles.emptySubText}>
                    İnternet bağlantısı geldiğinde tüm konumlar görünecek
                  </Text>
                )}
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
                  selected={editType === 'DEPOT'}
                  onPress={() => setEditType('DEPOT')}
                  style={[styles.modalChip, { backgroundColor: editType === 'DEPOT' ? 'rgba(0, 122, 255, 0.1)' : Colors.background }]}
                  textStyle={{ color: editType === 'DEPOT' ? Colors.primary : Colors.textLight }}
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
                  onPress={handleUpdateLocation}
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
