import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Button, Modal, TextInput, Alert, Pressable, ScrollView } from 'react-native';
import { getCustomers, addCustomer, updateCustomer, getCustomerPurchases } from '../../lib/api';
import loyaltyService from '../../lib/loyalty';
import { Customer, CustomerPurchase } from '../../types';
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

const CustomersScreen = () => {
  const { formatPrice, settings } = useStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [purchases, setPurchases] = useState<CustomerPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [formError, setFormError] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState<any>(null);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<any[]>([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  // Replace with your actual auth token logic
  const getToken = async () => {
    // e.g. return await auth().getToken();
    return 'YOUR_AUTH_TOKEN';
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    }
    setLoading(false);
  };

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowProfile(true);
    setPurchasesLoading(true);
    setLoyaltyLoading(true);
    try {
      const purchases = await getCustomerPurchases(customer.id);
      let purchaseList: any[] = Array.isArray(purchases)
        ? purchases
        : (typeof purchases === 'object' && Array.isArray((purchases as any).purchases))
        ? (purchases as any).purchases
        : [];
      setPurchases(purchaseList);
      // Loyalty points
      const points = await loyaltyService.getCustomerPoints(customer.id);
      setLoyaltyPoints(points);
      const txs = await loyaltyService.getCustomerTransactions(customer.id);
      setLoyaltyTransactions(Array.isArray(txs) ? txs : []);
    } catch (error) {
      setPurchases([]);
      setLoyaltyPoints(null);
      setLoyaltyTransactions([]);
    } finally {
      setPurchasesLoading(false);
      setLoyaltyLoading(false);
    }
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    setSelectedCustomer(null);
    setPurchases([]);
    setPurchasesLoading(false);
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setFormData({ ...initialFormData, id: uuidv4() });
    setFormError('');
    setShowFormModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setFormError('');
    setShowFormModal(true);
  };

  const handleDeletePress = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (customerToDelete) {
      // Soft delete: just remove from UI for now
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      setShowDeleteModal(false);
      setCustomerToDelete(null);
      // TODO: Implement backend delete if available
    }
  };

  const handleFormSubmit = async () => {
    if (!formData.name || !formData.email) {
      setFormError('Name and Email are required');
      return;
    }
    try {
      if (editingCustomer) {
        await updateCustomer({ ...editingCustomer, ...formData });
      } else {
        await addCustomer({ ...formData, createdAt: new Date().toISOString(), storeInfoId: 1 }); // storeInfoId: 1 as placeholder
      }
      setShowFormModal(false);
      setFormData(initialFormData);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error) {
      setFormError('Failed to save customer.');
    }
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity style={styles.customerItem} onPress={() => handleSelectCustomer(item)}>
      <Ionicons name="person-circle" size={32} color="#007AFF" style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity onPress={() => handleEditCustomer(item)} style={{ marginRight: 8 }}>
        <Ionicons name="create-outline" size={22} color="#007AFF" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeletePress(item)}>
        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderOrderDetails = (order: any) => (
    <View style={styles.orderDetails}>
      <Text style={styles.orderDetailTitle}>Order Details</Text>
      <Text>Date: {new Date(order.date).toLocaleString()}</Text>
      <Text>Status: {order.status}</Text>
      <Text>Total: {formatPrice(order.total)}</Text>
      <Text>Payment: {order.paymentMethod}</Text>
      <Text style={{ marginTop: 8, fontWeight: 'bold' }}>Items:</Text>
      {order.items && order.items.length > 0 ? (
        order.items.map((item: any, idx: number) => (
          <Text key={idx} style={{ marginLeft: 8 }}>
            - {item.quantity} x {item.name} @ {formatPrice(item.price)}
          </Text>
        ))
      ) : (
        <Text style={{ marginLeft: 8 }}>No items</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customers</Text>
        <Button title="Add Customer" onPress={handleAddCustomer} />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={item => item.id}
          renderItem={renderCustomer}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
      {/* Customer Profile Modal */}
      <Modal visible={showProfile} animationType="slide" onRequestClose={handleCloseProfile}>
        <ScrollView style={styles.profileContainer}>
          <TouchableOpacity onPress={handleCloseProfile} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          {selectedCustomer && (
            <>
              <Text style={styles.profileTitle}>{selectedCustomer.name}</Text>
              <Text style={styles.profileEmail}>{selectedCustomer.email}</Text>
              <Text style={styles.profileInfo}>Phone: {selectedCustomer.phone || '-'}</Text>
              <Text style={styles.profileInfo}>Address: {selectedCustomer.address || '-'}</Text>
              {/* Loyalty Points Section */}
              <View style={{ marginTop: 16, marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Loyalty Points</Text>
                {loyaltyLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 8 }} />
                ) : loyaltyPoints ? (
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#007AFF', marginTop: 4 }}>{loyaltyPoints.points} pts</Text>
                ) : (
                  <Text style={{ color: '#888' }}>No points</Text>
                )}
                <TouchableOpacity style={{ marginTop: 8, backgroundColor: '#007AFF', padding: 10, borderRadius: 8, alignItems: 'center' }} onPress={() => setShowRedeemModal(true)}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Redeem Points</Text>
                </TouchableOpacity>
              </View>
              {/* Loyalty Transactions */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>Points History</Text>
                {loyaltyLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : loyaltyTransactions.length === 0 ? (
                  <Text style={{ color: '#888' }}>No transactions</Text>
                ) : (
                  loyaltyTransactions.map((tx, idx) => {
                    let desc = tx.description;
                    if (tx.type === 'redeemed' && settings?.currency?.symbol) {
                      // Replace $ with selected currency symbol in the discount part
                      desc = desc.replace(/\$(\d+(?:\.\d+)?)/, `${settings.currency.symbol}$1`);
                    }
                    return (
                      <View key={tx.id || idx} style={{ marginBottom: 4 }}>
                        <Text style={{ color: tx.type === 'earned' ? '#007AFF' : '#FF3B30' }}>{tx.type === 'earned' ? '+' : ''}{tx.points} pts - {desc}</Text>
                        <Text style={{ color: '#888', fontSize: 12 }}>{new Date(tx.transactionDate).toLocaleString()}</Text>
                      </View>
                    );
                  })
                )}
              </View>
              {/* Purchase History */}
              <Text style={styles.profileSubtitle}>Purchase History</Text>
              {purchasesLoading ? (
                <ActivityIndicator size="small" color="#007AFF" style={{ marginTop: 10 }} />
              ) : purchases.length === 0 ? (
                <Text style={styles.noPurchases}>No purchases found.</Text>
              ) : (
                <FlatList
                  data={purchases}
                  keyExtractor={item => String(item.purchaseId)}
                  renderItem={({ item }) => (
                    <View style={styles.purchaseItem}>
                      <Text style={styles.purchaseDate}>{new Date(item.purchaseDate).toLocaleDateString()}</Text>
                      <Text style={styles.purchaseOrderId}>Order ID: {item.orderId}</Text>
                      <Text style={styles.purchaseTotal}>Total: {formatPrice(item.order.total)}</Text>
                      {renderOrderDetails(item.order)}
                    </View>
                  )}
                />
              )}
            </>
          )}
        </ScrollView>
        {/* Redeem Points Modal */}
        <Modal visible={showRedeemModal} animationType="slide" transparent onRequestClose={() => setShowRedeemModal(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, width: 320 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Redeem Points</Text>
              <Text>Enter points to redeem:</Text>
              <TextInput
                value={redeemInput}
                onChangeText={setRedeemInput}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginVertical: 12, fontSize: 16 }}
                placeholder="e.g. 100"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Button title="Cancel" onPress={() => setShowRedeemModal(false)} />
                <View style={{ width: 12 }} />
                <Button
                  title={redeemLoading ? 'Processing...' : 'Redeem'}
                  onPress={async () => {
                    setRedeemLoading(true);
                    try {
                      await loyaltyService.redeemPoints({ customerId: selectedCustomer!.id, pointsToRedeem: parseInt(redeemInput) });
                      Alert.alert('Success', 'Points redeemed!');
                      setShowRedeemModal(false);
                      setRedeemInput('');
                      // Refresh loyalty info
                      const points = await loyaltyService.getCustomerPoints(selectedCustomer!.id);
                      setLoyaltyPoints(points);
                      const txs = await loyaltyService.getCustomerTransactions(selectedCustomer!.id);
                      setLoyaltyTransactions(Array.isArray(txs) ? txs : []);
                    } catch (e: any) {
                      Alert.alert('Error', e.message || 'Failed to redeem points');
                    }
                    setRedeemLoading(false);
                  }}
                  disabled={redeemLoading || !redeemInput}
                />
              </View>
            </View>
          </View>
        </Modal>
      </Modal>
      {/* Add/Edit Customer Modal */}
      <Modal visible={showFormModal} animationType="slide" onRequestClose={() => setShowFormModal(false)}>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={() => setShowFormModal(false)} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.profileTitle}>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</Text>
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
              <Text style={[styles.buttonText, styles.saveButtonText]}>{editingCustomer ? 'Save Changes' : 'Add Customer'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={{ fontSize: 18, marginBottom: 16 }}>Delete this customer?</Text>
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
  customerItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  customerName: { fontSize: 18, fontWeight: '500' },
  customerEmail: { fontSize: 14, color: '#888' },
  profileContainer: { flex: 1, backgroundColor: '#fff', padding: 24 },
  closeButton: { position: 'absolute', top: 32, right: 24, zIndex: 10 },
  profileTitle: { fontSize: 28, fontWeight: 'bold', marginTop: 60, marginBottom: 8 },
  profileEmail: { fontSize: 16, color: '#888', marginBottom: 8 },
  profileInfo: { fontSize: 16, marginBottom: 4 },
  profileSubtitle: { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  noPurchases: { fontSize: 16, color: '#888', marginTop: 16 },
  purchaseItem: { padding: 12, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 8 },
  purchaseDate: { fontSize: 16, fontWeight: '500' },
  purchaseOrderId: { fontSize: 14, color: '#888' },
  purchaseTotal: { fontSize: 16, color: '#007AFF', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12, fontSize: 16 },
  formError: { color: '#FF3B30', marginBottom: 8 },
  deleteModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  deleteModalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 8, width: 300, alignItems: 'center' },
  orderDetails: { backgroundColor: '#f7f7f7', borderRadius: 8, padding: 12, marginTop: 8 },
  orderDetailTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
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

export default CustomersScreen; 