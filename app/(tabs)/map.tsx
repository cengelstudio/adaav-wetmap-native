import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import { Button, Modal, Portal, Surface, Text, TextInput, Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { locationService } from '../../services/api';
import { Location as LocationType, LocationType as LocType } from '../../types';
import { NetworkStatusIndicator } from '../../components/NetworkStatusIndicator';
import { useNetwork } from '../../context/NetworkContext';
import { offlineService } from '../../services/offlineService';
import NetInfo from '@react-native-community/netinfo';

// KKTC'nin merkezi koordinatları
const INITIAL_REGION: Region = {
  latitude: 35.1856,
  longitude: 33.3823,
  latitudeDelta: 0.5,    // Daha geniş bir alan göstermek için artırıldı
  longitudeDelta: 0.5,   // Daha geniş bir alan göstermek için artırıldı
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { isConnected, syncOfflineData, isSyncing } = useNetwork();
  const [locations, setLocations] = useState<LocationType[]>([]);
  const [offlineLocations, setOfflineLocations] = useState<LocationType[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(INITIAL_REGION);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<LocType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    fetchLocations();
    fetchOfflineLocations();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchLocations();
      fetchOfflineLocations();
    }
  }, [isConnected]);

  const fetchLocations = async () => {
    try {
      const data = await locationService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchOfflineLocations = async () => {
    try {
      const data = await offlineService.getLocalLocations();
      setOfflineLocations(data);
    } catch (error) {
      console.error('Error fetching offline locations:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCurrentLocation(newLocation);

      // Kullanıcının konumuna göre haritayı güncelle ama daha geniş bir alan göster
      setMapRegion({
        ...newLocation,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const handleAddLocation = async () => {
    if (!currentLocation || !selectedType || !title) return;

    const newLocation = {
      title: title,
      description: description || '',
      type: selectedType,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      city: 'KKTC'
    };

    try {
      setLoading(true);

      if (!isConnected) {
        // Offline mode - save locally
        const localLocation = { ...newLocation, id: `local_${Date.now()}` };
        await offlineService.saveLocalLocation(localLocation);
        await fetchOfflineLocations();
        setSyncMessage('Konum çevrimdışı olarak kaydedildi. İnternet bağlantısı geldiğinde senkronize edilecek.');
      } else {
        // Online mode - save to server
        await locationService.createLocation(newLocation);
        await fetchLocations();
        setSyncMessage('Konum başarıyla kaydedildi.');
      }

      setIsAddModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error adding location:', error);
      setSyncMessage('Konum kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedType(null);
  };

  const handleGetDirections = (latitude: number, longitude: number) => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'google.navigation:',
    });
    const url = Platform.select({
      ios: `${scheme}?daddr=${latitude},${longitude}`,
      android: `${scheme}q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to Google Maps web URL if native apps are not available
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        }
      }).catch((err) => {
        console.error('Error opening maps:', err);
        // Fallback to Google Maps web URL
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        Linking.openURL(webUrl);
      });
    }
  };

  const handleSyncOfflineData = async () => {
    if (isSyncing) return; // Prevent multiple syncs

    // Check internet connection
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      setSyncMessage('İnternet bağlantısı yok. Senkronizasyon için internet bağlantısı gereklidir.');
      return;
    }

    try {
      await syncOfflineData();
      await fetchLocations();
      await fetchOfflineLocations();
      setSyncMessage('Çevrimdışı veriler başarıyla senkronize edildi.');
    } catch (error) {
      console.error('Error syncing offline data:', error);
      setSyncMessage('Senkronizasyon sırasında bir hata oluştu.');
    }
  };

  const allLocations = [...locations, ...offlineLocations];

  return (
    <View style={styles.container}>
      <NetworkStatusIndicator />
      <MapView
        style={styles.map}
        initialRegion={mapRegion}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton
        onRegionChangeComplete={setMapRegion}
      >
        {allLocations.map((location) => {
          const isOffline = location.id.startsWith('local_');
          return (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.title}
              description={location.description}
              pinColor={isOffline ? Colors.warning : (location.type === 'WETLAND' ? Colors.secondary : Colors.primary)}
            >
              <Callout tooltip>
                <Surface style={[styles.calloutContainer, isOffline && styles.offlineCallout]}>
                  <View style={styles.calloutHeader}>
                    <MaterialCommunityIcons
                      name={location.type === 'WETLAND' ? 'water' : 'warehouse'}
                      size={24}
                      color={isOffline ? Colors.warning : (location.type === 'WETLAND' ? Colors.secondary : Colors.primary)}
                    />
                    <Text style={styles.calloutTitle}>{location.title}</Text>
                    {isOffline && (
                      <MaterialCommunityIcons
                        name="wifi-off"
                        size={16}
                        color={Colors.warning}
                        style={styles.offlineIcon}
                      />
                    )}
                  </View>
                  {location.description && (
                    <Text style={styles.calloutDescription}>{location.description}</Text>
                  )}
                  {isOffline && (
                    <Text style={styles.offlineText}>Çevrimdışı kayıt</Text>
                  )}
                  <View style={styles.calloutCoordinates}>
                    <View style={styles.coordinateItem}>
                      <MaterialCommunityIcons name="latitude" size={16} color={Colors.textLight} />
                      <Text style={styles.coordinateText}>{location.latitude.toFixed(4)}</Text>
                    </View>
                    <View style={styles.coordinateItem}>
                      <MaterialCommunityIcons name="longitude" size={16} color={Colors.textLight} />
                      <Text style={styles.coordinateText}>{location.longitude.toFixed(4)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={() => handleGetDirections(location.latitude, location.longitude)}
                  >
                    <MaterialCommunityIcons name="directions" size={20} color={Colors.white} />
                    <Text style={styles.directionsButtonText}>Yol Tarifi Al</Text>
                  </TouchableOpacity>
                </Surface>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Sync Button - only show when connected and there are offline locations */}
      {isConnected && offlineLocations.length > 0 && (
        <Button
          mode="contained"
          onPress={handleSyncOfflineData}
          disabled={isSyncing}
          loading={isSyncing}
          style={[
            styles.syncButton,
            {
              top: insets.top + 70,
              right: 16,
            },
          ]}
          icon={isSyncing ? undefined : "sync"}
          textColor={Colors.white}
          contentStyle={styles.syncButtonContent}
        >
          {isSyncing ? 'Senkronize Ediliyor...' : 'Senkronize Et'}
        </Button>
      )}

      <Button
        mode="contained"
        onPress={() => setIsDropdownVisible(true)}
        style={[
          styles.addButton,
          {
            top: insets.top + 16,
            right: 16,
          },
        ]}
        icon="plus"
        textColor={Colors.white}
        contentStyle={styles.addButtonContent}
      >
        Ekle
      </Button>

      <Portal>
        <Modal
          visible={isDropdownVisible}
          onDismiss={() => setIsDropdownVisible(false)}
          contentContainerStyle={styles.dropdownModal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Konum Türü Seçin</Text>
          <View style={styles.modalContent}>
            <Button
              mode="contained"
              onPress={() => {
                setSelectedType('WETLAND');
                setIsDropdownVisible(false);
                setIsAddModalVisible(true);
              }}
              style={styles.modalButton}
              icon="water"
            >
              Sulak Alan
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setSelectedType('DEPOT');
                setIsDropdownVisible(false);
                setIsAddModalVisible(true);
              }}
              style={styles.modalButton}
              icon="warehouse"
            >
              Depo
            </Button>
          </View>
        </Modal>

        <Modal
          visible={isAddModalVisible}
          onDismiss={() => setIsAddModalVisible(false)}
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
                {selectedType === 'WETLAND' ? 'Sulak Alan Ekle' : 'Depo Ekle'}
              </Text>
              <View style={styles.modalContent}>
                <TextInput
                  label="Başlık"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Açıklama"
                  value={description}
                  onChangeText={setDescription}
                  mode="outlined"
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.coordinates}>
                  <TextInput
                    label="Enlem"
                    value={currentLocation?.latitude.toString()}
                    disabled
                    mode="outlined"
                    style={styles.coordinateInput}
                  />
                  <TextInput
                    label="Boylam"
                    value={currentLocation?.longitude.toString()}
                    disabled
                    mode="outlined"
                    style={styles.coordinateInput}
                  />
                </View>
                <TextInput
                  label="Tür"
                  value={selectedType === 'WETLAND' ? 'Sulak Alan' : 'Depo'}
                  disabled
                  mode="outlined"
                  style={styles.input}
                />
                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={() => setIsAddModalVisible(false)}
                    style={styles.cancelButton}
                  >
                    İptal
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleAddLocation}
                    loading={loading}
                    disabled={loading || !title}
                    style={styles.submitButton}
                  >
                    Kaydet
                  </Button>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      <Snackbar
        visible={!!syncMessage}
        onDismiss={() => setSyncMessage('')}
        duration={3000}
        style={styles.snackbar}
      >
        {syncMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  addButton: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 12,
    paddingHorizontal: 5,
  },
  addButtonContent: {
    height: 40,
  },
  dropdownModal: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
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
  modal: {
    backgroundColor: 'white',
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
  scrollContent: {
    flexGrow: 1,
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
  coordinates: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    minWidth: 100,
  },
  modalButton: {
    backgroundColor: Colors.primary,
  },
  calloutContainer: {
    padding: 12,
    minWidth: 200,
    borderRadius: 12,
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  calloutDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  calloutCoordinates: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  coordinateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordinateText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  directionsButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  directionsButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  offlineCallout: {
    backgroundColor: Colors.warning,
  },
  offlineIcon: {
    marginLeft: 8,
  },
  offlineText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  syncButton: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderRadius: 12,
    paddingHorizontal: 5,
  },
  syncButtonContent: {
    height: 40,
  },
  snackbar: {
    backgroundColor: Colors.primary,
  },
});
