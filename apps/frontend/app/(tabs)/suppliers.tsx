import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Button, Modal, TextInput, Alert, Pressable, ScrollView } from 'react-native';
import { Redirect } from 'expo-router';
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../../lib/api';
import { Supplier } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import useStore from '../../store/useStore';

const initialFormData = {
  id: '',
  name: '',
  email: '',
  phone: '',
  address: '',
};

const SuppliersScreen = () => {
  const { authenticatedEmployee } = useStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');

  // Replace with your actual auth token logic
  const getToken = async () => {
    // e.g. return await auth().getToken();
    return 'YOUR_AUTH_TOKEN';
  };

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error('Failed to fetch suppliers', error);
      }
      setLoading(false);
    };
    if (authenticatedEmployee) {
      fetchSuppliers();
    }
  }, []);

  // Redirect to dashboard if no employee is logged in
  if (!authenticatedEmployee) {
    console.log('No authenticated employee, redirecting to dashboard');
    return <Redirect href="/(tabs)/dashboard" />;
  }

  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    setSelectedSupplier(null);
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setFormData({ ...initialFormData, id: uuidv4() });
    setFormError('');
    setShowFormModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      id: supplier.id,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setFormError('');
    setShowFormModal(true);
  };

  const handleDeletePress = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (supplierToDelete) {
      try {
        await deleteSupplier(supplierToDelete.id);
        setSuppliers(suppliers.filter(s => s.id !== supplierToDelete.id));
        setShowDeleteModal(false);
        setSupplierToDelete(null);
      } catch (error) {
        Alert.alert('Error', 'Failed to delete supplier.');
      }
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.name || !formData.email) {
      setFormError('Name and Email are required');
      return;
    }
    try {
      if (editingSupplier) {
        await updateSupplier({ ...editingSupplier, ...formData });
      } else {
        await addSupplier({ ...formData, storeInfoId: 1, createdAt: new Date().toISOString() }); // storeInfoId: 1 as placeholder
      }
      setShowFormModal(false);
      setFormData(initialFormData);
      setEditingSupplier(null);
      // Refresh list
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      setFormError('Failed to save supplier.');
    }
  };

  const renderSupplier = ({ item }: { item: Supplier }) => (
    <TouchableOpacity style={styles.supplierItem} onPress={() => handleSelectSupplier(item)}>
      <Ionicons name="business" size={32} color="#007AFF" style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.supplierName}>{item.name}</Text>
        <Text style={styles.supplierEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity onPress={() => handleEditSupplier(item)} style={{ marginRight: 8 }}>
        <Ionicons name="create-outline" size={22} color="#007AFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeletePress(item)}>
        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Filtered suppliers based on search
  const filteredSuppliers = suppliers.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suppliers</Text>
        <Button title="Add Supplier" onPress={handleAddSupplier} />
      </View>
      {/* Search Box */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers by name or email"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredSuppliers}
          keyExtractor={item => item.id}
          renderItem={renderSupplier}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      {/* Supplier Profile Modal */}
      <Modal visible={showProfile} animationType="slide" onRequestClose={handleCloseProfile}>
        <ScrollView style={styles.profileContainer}>
          <TouchableOpacity onPress={handleCloseProfile} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          {selectedSupplier && (
            <>
              <Text style={styles.profileTitle}>{selectedSupplier.name}</Text>
              <Text style={styles.profileEmail}>{selectedSupplier.email}</Text>
              <Text style={styles.profileInfo}>Phone: {selectedSupplier.phone || '-'}</Text>
              <Text style={styles.profileInfo}>Address: {selectedSupplier.address || '-'}</Text>
            </>
          )}
        </ScrollView>
      </Modal>
      {/* Add/Edit Supplier Modal */}
      <Modal visible={showFormModal} animationType="slide" onRequestClose={() => setShowFormModal(false)}>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={() => setShowFormModal(false)} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.profileTitle}>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={text => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={formData.phone}
            onChangeText={text => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            value={formData.address}
            onChangeText={text => setFormData({ ...formData, address: text })}
          />
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowFormModal(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.saveButton]}
              onPress={handleFormSubmit}>
              <Text style={[styles.buttonText, styles.saveButtonText]}>{editingSupplier ? 'Save Changes' : 'Add Supplier'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={{ fontSize: 18, marginBottom: 16 }}>Delete this supplier?</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button title="Cancel" onPress={() => setShowDeleteModal(false)} />&nbsp; &nbsp;
              <Button title="Delete" color="#FF3B30" onPress={handleConfirmDelete} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 6,
    color: '#333',
  },
  supplierItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  supplierName: { fontSize: 18, fontWeight: '500' },
  supplierEmail: { fontSize: 14, color: '#888' },
  profileContainer: { flex: 1, backgroundColor: '#fff', padding: 24 },
  closeButton: { position: 'absolute', top: 32, right: 24, zIndex: 10 },
  profileTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 60, marginBottom: 8 },
  profileEmail: { fontSize: 16, color: '#888', marginBottom: 8 },
  profileInfo: { fontSize: 16, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12, fontSize: 16 },
  formError: { color: '#FF3B30', marginBottom: 8 },
  deleteModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  deleteModalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 8, width: 300, alignItems: 'center' },
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

export default SuppliersScreen;