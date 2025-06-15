import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useStore} from '../store/useStore';
import {Currency, StoreInfo} from '../types';

const currencies: Currency[] = [
  {code: 'USD', symbol: '$', name: 'US Dollar'},
  {code: 'EUR', symbol: '€', name: 'Euro'},
  {code: 'GBP', symbol: '£', name: 'British Pound'},
  {code: 'JPY', symbol: '¥', name: 'Japanese Yen'},
  {code: 'CNY', symbol: '¥', name: 'Chinese Yuan'},
  {code: 'KRW', symbol: '₩', name: 'South Korean Won'},
  {code: 'INR', symbol: '₹', name: 'Indian Rupee'},
  {code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah'},
  {code: 'CAD', symbol: 'C$', name: 'Canadian Dollar'},
  {code: 'AUD', symbol: 'A$', name: 'Australian Dollar'},
  {code: 'SGD', symbol: 'S$', name: 'Singapore Dollar'},
];

const SettingsScreen = () => {
  const {settings, updateCurrency, updateStoreInfo} = useStore();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showStoreInfoModal, setShowStoreInfoModal] = useState(false);
  const [storeInfo, setStoreInfo] = useState({
    name: settings.storeInfo?.name || '',
    address: settings.storeInfo?.address || '',
    phone: settings.storeInfo?.phone || '',
    email: settings.storeInfo?.email || '',
    website: settings.storeInfo?.website || '',
    taxId: settings.storeInfo?.taxId || '',
  });

  const handleSaveStoreInfo = async () => {
    try {
      await updateStoreInfo(storeInfo);
      setShowStoreInfoModal(false);
      Alert.alert('Success', 'Store information updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update store information.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Settings</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setShowCurrencyModal(true)}>
          <View style={styles.settingContent}>
            <Icon name="cash" size={24} color="#007AFF" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Currency</Text>
              <Text style={styles.settingDetail}>
                {settings.currency.name} ({settings.currency.symbol})
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setShowStoreInfoModal(true)}>
          <View style={styles.settingContent}>
            <Icon name="business" size={24} color="#007AFF" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Store Information</Text>
              <Text style={styles.settingDetail}>
                {settings.storeInfo?.name || 'Not configured'}
              </Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Icon name="notifications" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Switch value={true} onValueChange={() => {}} />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Icon name="cloud-upload" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Auto Backup</Text>
          </View>
          <Switch value={true} onValueChange={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Icon name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.settingText}>App Information</Text>
          </View>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </View>

      {/* Currency Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCurrencyModal}
        onRequestClose={() => setShowCurrencyModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyModal(false)}
                style={styles.closeButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={currencies}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    item.code === settings.currency.code &&
                      styles.selectedItem,
                  ]}
                  onPress={async () => {
                    try {
                      await updateCurrency(item);
                      setShowCurrencyModal(false);
                      Alert.alert('Success', 'Currency updated successfully!');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to update currency.');
                    }
                  }}>
                  <View style={styles.currencyItemContent}>
                    <Text style={styles.currencySymbol}>{item.symbol}</Text>
                    <View style={styles.currencyDetails}>
                      <Text style={styles.currencyName}>{item.name}</Text>
                      <Text style={styles.currencyCode}>{item.code}</Text>
                    </View>
                  </View>
                  {item.code === settings.currency.code && (
                    <Icon name="checkmark" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={item => item.code}
            />
          </View>
        </View>
      </Modal>

      {/* Store Information Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showStoreInfoModal}
        onRequestClose={() => setShowStoreInfoModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Store Information</Text>
              <TouchableOpacity
                onPress={() => setShowStoreInfoModal(false)}
                style={styles.closeButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formField}>
                <Text style={styles.label}>Store Name</Text>
                <TextInput
                  style={styles.input}
                  value={storeInfo.name}
                  onChangeText={text => setStoreInfo({...storeInfo, name: text})}
                  placeholder="Enter store name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={storeInfo.address}
                  onChangeText={text =>
                    setStoreInfo({...storeInfo, address: text})
                  }
                  placeholder="Enter store address"
                  multiline
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={storeInfo.phone}
                  onChangeText={text =>
                    setStoreInfo({...storeInfo, phone: text})
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={storeInfo.email}
                  onChangeText={text =>
                    setStoreInfo({...storeInfo, email: text})
                  }
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={styles.input}
                  value={storeInfo.website}
                  onChangeText={text =>
                    setStoreInfo({...storeInfo, website: text})
                  }
                  placeholder="Enter website URL"
                  keyboardType="url"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Tax ID</Text>
                <TextInput
                  style={styles.input}
                  value={storeInfo.taxId}
                  onChangeText={text =>
                    setStoreInfo({...storeInfo, taxId: text})
                  }
                  placeholder="Enter tax ID"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowStoreInfoModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveStoreInfo}>
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  settingInfo: {
    marginLeft: 16,
  },
  settingDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  versionText: {
    color: '#666',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f0f9ff',
  },
  currencyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    width: 40,
  },
  currencyDetails: {
    marginLeft: 16,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  currencyCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  formContainer: {
    padding: 20,
  },
  formField: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e5e5e5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
  },
});

export default SettingsScreen;