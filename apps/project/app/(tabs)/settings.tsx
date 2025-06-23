import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Modal, FlatList, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../../store/useStore';
import { Currency, PrinterDevice } from '../../types';
import { scanPrinters } from '../../utils/printer';
import { Platform } from 'react-native';

const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

const initialSettings = {
  currency: { code: 'USD', symbol: '$', name: 'US Dollar' },
  printer: { type: 'none' },
  storeInfo: {
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
  },
};

export default function SettingsScreen() {
  const { settings, updateCurrency, updatePrinterSettings, updateStoreInfo } = useStore();
  if (!settings) {
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [showStoreInfoModal, setShowStoreInfoModal] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storeInfoDefaults: Partial<{
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;
  }> = settings?.storeInfo ?? {};
  const [storeInfo, setStoreInfo] = useState({
    name: storeInfoDefaults.name || '',
    address: storeInfoDefaults.address || '',
    phone: storeInfoDefaults.phone || '',
    email: storeInfoDefaults.email || '',
    website: storeInfoDefaults.website || '',
    taxId: storeInfoDefaults.taxId || '',
  });

  const handleScanPrinters = async () => {
    if (Platform.OS === 'web') {
      setError('Printer scanning is not available on web');
      return;
    }

    setScanning(true);
    setError(null);
    try {
      const devices = await scanPrinters();
      setPrinters(devices);
    } catch (err) {
      setError('Failed to scan for printers');
    } finally {
      setScanning(false);
    }
  };

  const handleSelectPrinter = (printer: PrinterDevice) => {
    updatePrinterSettings({
      type: printer.address ? 'bluetooth' : 'usb',
      deviceId: printer.deviceId,
      deviceName: printer.deviceName,
      address: printer.address,
    });
    setShowPrinterModal(false);
  };

  const handleSaveStoreInfo = () => {
    updateStoreInfo(storeInfo);
    setShowStoreInfoModal(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Settings</Text>
        <Pressable 
          style={styles.settingItem}
          onPress={() => setShowCurrencyModal(true)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="cash" size={24} color="#007AFF" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Currency</Text>
              <Text style={styles.settingDetail}>
                {settings?.currency.name} ({settings?.currency.symbol})
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </Pressable>

        <Pressable 
          style={styles.settingItem}
          onPress={() => {
            setShowPrinterModal(true);
            handleScanPrinters();
          }}
        >
          <View style={styles.settingContent}>
            <Ionicons name="print" size={24} color="#007AFF" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Receipt Printer</Text>
              <Text style={styles.settingDetail}>
                {settings?.printer?.deviceName || 'No printer configured'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </Pressable>

        <Pressable 
          style={styles.settingItem}
          onPress={() => setShowStoreInfoModal(true)}
        >
          <View style={styles.settingContent}>
            <Ionicons name="business" size={24} color="#007AFF" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingText}>Store Information</Text>
              <Text style={styles.settingDetail}>
                {settings?.storeInfo?.name || 'Not configured'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="notifications" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Switch value={true} onValueChange={() => {}} />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="cloud-upload" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Auto Backup</Text>
          </View>
          <Switch value={true} onValueChange={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.settingText}>App Information</Text>
          </View>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
        <Pressable style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="document-text" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </Pressable>
        <Pressable style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
            <Text style={styles.settingText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </Pressable>
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
              <Pressable
                onPress={() => setShowCurrencyModal(false)}
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            <FlatList
              data={currencies}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.currencyItem,
                    item.code === settings?.currency.code && styles.selectedItem,
                  ]}
                  onPress={() => {
                    updateCurrency(item);
                    setShowCurrencyModal(false);
                  }}>
                  <View style={styles.currencyItemContent}>
                    <Text style={styles.currencySymbol}>{item.symbol}</Text>
                    <View style={styles.currencyDetails}>
                      <Text style={styles.currencyName}>{item.name}</Text>
                      <Text style={styles.currencyCode}>{item.code}</Text>
                    </View>
                  </View>
                  {item.code === settings?.currency.code && (
                    <Ionicons name="checkmark" size={24} color="#007AFF" />
                  )}
                </Pressable>
              )}
              keyExtractor={(item) => item.code}
            />
          </View>
        </View>
      </Modal>

      {/* Printer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPrinterModal}
        onRequestClose={() => setShowPrinterModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Printer</Text>
              <Pressable
                onPress={() => setShowPrinterModal(false)}
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            {Platform.OS === 'web' ? (
              <View style={styles.webPrinterInfo}>
                <Text style={styles.webPrinterText}>
                  On web, the browser's print dialog will be used for printing receipts.
                </Text>
              </View>
            ) : (
              <>
                <Pressable
                  style={styles.scanButton}
                  onPress={handleScanPrinters}
                  disabled={scanning}>
                  <Ionicons name="refresh" size={24} color="white" />
                  <Text style={styles.scanButtonText}>
                    {scanning ? 'Scanning...' : 'Scan for Printers'}
                  </Text>
                </Pressable>

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                {scanning ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Scanning for printers...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={printers}
                    renderItem={({ item }) => (
                      <Pressable
                        style={[
                          styles.printerItem,
                          item.deviceId === settings?.printer?.deviceId && styles.selectedItem,
                        ]}
                        onPress={() => handleSelectPrinter(item)}>
                        <View style={styles.printerItemContent}>
                          <Ionicons
                            name={item.address ? "bluetooth" : "print"}
                            size={24}
                            color="#007AFF"
                          />
                          <View style={styles.printerDetails}>
                            <Text style={styles.printerName}>{item.deviceName}</Text>
                            <Text style={styles.printerAddress}>
                              {item.address || 'USB Printer'}
                            </Text>
                          </View>
                        </View>
                        {item.deviceId === settings?.printer?.deviceId && (
                          <Ionicons name="checkmark" size={24} color="#007AFF" />
                        )}
                      </Pressable>
                    )}
                    keyExtractor={(item) => item.deviceId}
                    ListEmptyComponent={
                      !scanning && (
                        <Text style={styles.emptyText}>
                          No printers found. Make sure your printer is turned on and nearby.
                        </Text>
                      )
                    }
                  />
                )}
              </>
            )}
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
              <Pressable
                onPress={() => setShowStoreInfoModal(false)}
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            
            <ScrollView style={styles.formContainer}>
              <View style={styles.formField}>
                <Text style={styles.label}>Store Name</Text>
                <TextInput
                  style={styles.input}
                  value={storeInfo.name}
                  onChangeText={(text) => setStoreInfo({ ...storeInfo, name: text })}
                  placeholder="Enter store name"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={storeInfo.address}
                  onChangeText={(text) => setStoreInfo({ ...storeInfo, address: text })}
                  placeholder="Enter store address"
                  multiline
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={storeInfo.phone}
                  onChangeText={(text) => setStoreInfo({ ...storeInfo, phone: text })}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={storeInfo.email}
                  onChangeText={(text) => setStoreInfo({ ...storeInfo, email: text })}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Website</Text>
                <TextInput
                  style={styles.input}
                  value={storeInfo.website}
                  onChangeText={(text) => setStoreInfo({ ...storeInfo, website: text })}
                  placeholder="Enter website URL"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Tax ID</Text>
                <TextInput
                  style={styles.input}
                  value={storeInfo.taxId}
                  onChangeText={(text) => setStoreInfo({ ...storeInfo, taxId: text })}
                  placeholder="Enter tax ID"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowStoreInfoModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveStoreInfo}>
                <Text style={[styles.buttonText, styles.saveButtonText]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingInfo: {
    marginLeft: 12,
  },
  settingDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  versionText: {
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
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
    marginLeft: 12,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '500',
  },
  currencyCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    margin: 16,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  printerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  printerDetails: {
    marginLeft: 12,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  printerAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    padding: 24,
    textAlign: 'center',
    color: '#666',
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    padding: 16,
  },
  webPrinterInfo: {
    padding: 24,
    alignItems: 'center',
  },
  webPrinterText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formField: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
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