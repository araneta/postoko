import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Alert, Pressable, ScrollView } from 'react-native';
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
  website: '',
  taxId: '',
  paymentTerms: '',
  creditLimit: '',
  currency: 'USD',
  rating: '',
  status: 'active' as const,
  notes: '',
};

const SuppliersScreen = () => {
  const { authenticatedEmployee, products } = useStore();
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      try {
        console.log('Attempting to fetch suppliers...');
        const data = await getSuppliers();
        console.log('Successfully fetched suppliers:', data);
        // Ensure all suppliers have a status field
        const normalizedSuppliers = data.map(supplier => ({
          ...supplier,
          status: supplier.status || 'active' as const
        }));
        setSuppliers(normalizedSuppliers);
      } catch (error) {
        console.error('Failed to fetch suppliers - detailed error:', error);
        // Show user-friendly error
        Alert.alert('Error', 'Failed to load suppliers. Please check if the API server is running on port 3000.');
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
      website: supplier.website || '',
      taxId: supplier.taxId || '',
      paymentTerms: supplier.paymentTerms || '',
      creditLimit: supplier.creditLimit?.toString() || '',
      currency: supplier.currency || 'USD',
      rating: supplier.rating?.toString() || '',
      status: supplier.status,
      notes: supplier.notes || '',
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
      const supplierData: Supplier = {
        id: formData.id,
        storeInfoId: 1,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        website: formData.website || undefined,
        taxId: formData.taxId || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
        currency: formData.currency,
        rating: formData.rating ? parseInt(formData.rating) : undefined,
        status: formData.status || 'active', // Ensure status always has a value
        notes: formData.notes || undefined,
        createdAt: editingSupplier?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingSupplier) {
        await updateSupplier(supplierData);
      } else {
        await addSupplier(supplierData);
      }

      setShowFormModal(false);
      setFormData(initialFormData);
      setEditingSupplier(null);

      // Refresh list
      const data = await getSuppliers();
      const normalizedSuppliers = data.map(supplier => ({
        ...supplier,
        status: supplier.status || 'active' as const
      }));
      setSuppliers(normalizedSuppliers);
    } catch (error) {
      setFormError('Failed to save supplier.');
    }
  };

  const getSupplierProducts = (supplierId: string) => {
    return products.filter(product => product.supplierId === supplierId);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'inactive': return '#FF3B30';
      case 'pending': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <Text style={styles.noRating}>No rating</Text>;

    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={16}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const renderSupplier = ({ item }: { item: Supplier }) => {
    const supplierProducts = getSupplierProducts(item.id);

    return (
      <TouchableOpacity style={styles.supplierItem} onPress={() => handleSelectSupplier(item)}>
        <View style={styles.supplierIcon}>
          <Ionicons name="business" size={32} color="#007AFF" />
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        </View>

        <View style={styles.supplierInfo}>
          <Text style={styles.supplierName}>{item.name}</Text>
          <Text style={styles.supplierEmail}>{item.email}</Text>
          <View style={styles.supplierMeta}>
            {renderStars(item.rating)}
            <Text style={styles.productCount}>
              {supplierProducts.length} product{supplierProducts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.supplierActions}>
          <TouchableOpacity onPress={() => handleEditSupplier(item)} style={styles.actionButton}>
            <Ionicons name="create-outline" size={22} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeletePress(item)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Filtered suppliers based on search and status
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      supplier.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suppliers</Text>
        <Pressable style={styles.addButton} onPress={handleAddSupplier}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Supplier</Text>
        </Pressable>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'active', 'inactive'] as const).map(status => (
          <Pressable
            key={status}
            style={[
              styles.filterButton,
              filterStatus === status && styles.filterButtonActive
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[
              styles.filterButtonText,
              filterStatus === status && styles.filterButtonTextActive
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredSuppliers}
          keyExtractor={item => item.id}
          renderItem={renderSupplier}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Supplier Profile Modal */}
      <Modal visible={showProfile} animationType="slide" onRequestClose={handleCloseProfile}>
        <ScrollView style={styles.profileContainer}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleCloseProfile} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleCloseProfile();
                if (selectedSupplier) handleEditSupplier(selectedSupplier);
              }}
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {selectedSupplier && (
            <>
              <View style={styles.profileTitleSection}>
                <Text style={styles.profileTitle}>{selectedSupplier.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedSupplier.status) }]}>
                  <Text style={styles.statusBadgeText}>{selectedSupplier.status?.toUpperCase() || 'UNKNOWN'}</Text>
                </View>
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{selectedSupplier.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{selectedSupplier.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{selectedSupplier.phone || 'Not provided'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{selectedSupplier.address || 'Not provided'}</Text>
                </View>
                {selectedSupplier.website && (
                  <View style={styles.infoRow}>
                    <Ionicons name="globe-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>{selectedSupplier.website}</Text>
                  </View>
                )}
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.sectionTitle}>Business Details</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="card-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>Tax ID: {selectedSupplier.taxId || 'Not provided'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>Payment Terms: {selectedSupplier.paymentTerms || 'Not specified'}</Text>
                </View>
                {selectedSupplier.creditLimit && (
                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>Credit Limit: ${selectedSupplier.creditLimit.toLocaleString()}</Text>
                  </View>
                )}
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.sectionTitle}>Performance</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="star-outline" size={20} color="#666" />
                  <View style={styles.ratingRow}>
                    <Text style={styles.infoText}>Rating: </Text>
                    {renderStars(selectedSupplier.rating)}
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="cube-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    Products: {getSupplierProducts(selectedSupplier.id).length}
                  </Text>
                </View>
              </View>

              {selectedSupplier.notes && (
                <View style={styles.profileSection}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notesText}>{selectedSupplier.notes}</Text>
                </View>
              )}

              <View style={styles.profileSection}>
                <Text style={styles.sectionTitle}>Products from this Supplier</Text>
                {getSupplierProducts(selectedSupplier.id).map(product => (
                  <View key={product.id} style={styles.productItem}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>
                      ${typeof product.cost === 'number' ? product.cost.toFixed(2) : (parseFloat(product.cost) || 0).toFixed(2)}
                    </Text>
                  </View>
                ))}
                {getSupplierProducts(selectedSupplier.id).length === 0 && (
                  <Text style={styles.noProducts}>No products assigned to this supplier</Text>
                )}
              </View>

              {/* Quick Actions */}
              <View style={styles.profileSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionButtons}>
                  <Pressable style={styles.actionButton}>
                    <Ionicons name="document-text-outline" size={20} color="#007AFF" />
                    <Text style={styles.actionButtonText}>View Orders</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton}>
                    <Ionicons name="analytics-outline" size={20} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Analytics</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton}>
                    <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                    <Text style={styles.actionButtonText}>New Order</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </Modal>

      {/* Add/Edit Supplier Modal */}
      <Modal visible={showFormModal} animationType="slide" onRequestClose={() => setShowFormModal(false)}>
        <ScrollView style={styles.formContainer}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setShowFormModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.formTitle}>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Basic Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Company Name *"
              value={formData.name}
              onChangeText={text => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email *"
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
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Website"
              value={formData.website}
              onChangeText={text => setFormData({ ...formData, website: text })}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Business Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Tax ID"
              value={formData.taxId}
              onChangeText={text => setFormData({ ...formData, taxId: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Payment Terms (e.g., Net 30)"
              value={formData.paymentTerms}
              onChangeText={text => setFormData({ ...formData, paymentTerms: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Credit Limit"
              value={formData.creditLimit}
              onChangeText={text => setFormData({ ...formData, creditLimit: text })}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Rating (1-5)"
              value={formData.rating}
              onChangeText={text => setFormData({ ...formData, rating: text })}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Status</Text>
            <View style={styles.statusButtons}>
              {(['active', 'inactive', 'pending'] as const).map(status => (
                <Pressable
                  key={status}
                  style={[
                    styles.statusButton,
                    formData.status === status && styles.statusButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, status })}
                >
                  <Text style={[
                    styles.statusButtonText,
                    formData.status === status && styles.statusButtonTextActive
                  ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional notes about this supplier..."
              value={formData.notes}
              onChangeText={text => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
            />
          </View>

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
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {editingSupplier ? 'Save Changes' : 'Add Supplier'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Supplier</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{supplierToDelete?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.deleteButton]}
                onPress={handleConfirmDelete}>
                <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete</Text>
              </Pressable>
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
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: '600'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  supplierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  supplierIcon: {
    position: 'relative',
    marginRight: 12,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  supplierEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  supplierMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  noRating: {
    fontSize: 12,
    color: '#999',
  },
  productCount: {
    fontSize: 12,
    color: '#666',
  },
  supplierActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  closeButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  profileTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productName: {
    fontSize: 16,
    color: '#333',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  noProducts: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
  },
  formSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666',
  },
  statusButtonTextActive: {
    color: 'white',
  },
  formError: {
    color: '#FF3B30',
    marginBottom: 8,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: 'white',
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
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
  },
  deleteButtonText: {
    color: 'white',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FF3B30',
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
});

export default SuppliersScreen;