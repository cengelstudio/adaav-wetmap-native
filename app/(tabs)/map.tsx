import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { locationService } from '../../services/api';
import { Location as LocationType, LocationType as LocType } from '../../types';

// KKTC'nin merkezi koordinatları
const INITIAL_REGION: Region = {
  latitude: 35.1856,
  longitude: 33.3823,
  latitudeDelta: 0.5,    // Daha geniş bir alan göstermek için artırıldı
  longitudeDelta: 0.5,   // Daha geniş bir alan göstermek için artırıldı
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [locations, setLocations] = useState<LocationType[]>([]);
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

  useEffect(() => {
    fetchLocations();
    getCurrentLocation();
  }, []);

  const fetchLocations = async () => {
    try {
      const data = await locationService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
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

    try {
      setLoading(true);
      await locationService.createLocation({
        title,
        description,
        type: selectedType,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        city: 'KKTC',
      });
      await fetchLocations();
      setIsAddModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error adding location:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedType(null);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={mapRegion}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton
        onRegionChangeComplete={setMapRegion}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.title}
            description={location.description}
            pinColor={location.type === 'WETLAND' ? Colors.secondary : Colors.primary}
          />
        ))}
      </MapView>

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
                setSelectedType('STORAGE');
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
});
