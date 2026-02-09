import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Supplier, SupplierOrder, SupplierOrderItem, Product } from '../types';

interface SupplierOrdersProps {
  supplier: Supplier;
  products: Product[];
  orders: SupplierOrder[];
  onCreateOrder: (order: SupplierOrder) => void;
  onUpdateOrder: (order: SupplierOrder) => void;
}

const initialOrderData = {
  id: '',
  supplierId: '',
  orderDate: '',
  expectedDelivery: '',
  status: 'pending' as const,
  items: [] as SupplierOrderItem[],
  totalAmount: 0,
  notes: '',
};

export default function SupplierOrders({ 
  supplier, 
  products, 
  orders, 
  onCreateOrder, 
  onUpdateOrder 
}: SupplierOrdersProps) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SupplierOrder | null>(null);
  const [orderData, setOrderData] = useState(initialOrderData);
  const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: number }>({});

  const supplierProducts = products.filter(product => product.supplierId === supplier.id);
  const supplierOrders = orders.filter(order => order.supplierId === supplier.id);

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setOrderData({
      ...initialOrderData,
      id: Date.now().toString(),
      supplierId: supplier.id,
      orderDate: new Date().toISOString().split('T')[0],
    });
    setSelectedProducts({});
    setShowOrderModal(true);
  };

  const handleEditOrder = (order: SupplierOrder) => {
    setEditingOrder(order);
    setOrderData(order);
    
    // Convert order items to selected products format
    const productQuantities: { [key: string]: number } = {};
    order.items.forEach(item => {
      productQuantities[item.productId] = item.quantity;
    });
    setSelectedProducts(productQuantities);
    setShowOrderModal(true);
  };

  const handleSaveOrder = () => {
    // Validate required fields
    if (!orderData.orderDate) {
      Alert.alert('Error', 'Order date is required');
      return;
    }

    // Create order items from selected products
    const items: SupplierOrderItem[] = Object.entries(selectedProducts)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        if (!product) throw new Error('Product not found');
        
        return {
          productId,
          productName: product.name,
          quantity,
          unitCost: product.cost,
          totalCost: product.cost * quantity,
        };
      });

    if (items.length === 0) {
      Alert.alert('Error', 'Please select at least one product');
      return;
    }

    const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

    const order: SupplierOrder = {
      ...orderData,
      items,
      totalAmount,
    };

    if (editingOrder) {
      onUpdateOrder(order);
    } else {
      onCreateOrder(order);
    }

    setShowOrderModal(false);
    setOrderData(initialOrderData);
    setSelectedProducts({});
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: Math.max(0, quantity),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'shipped': return '#007AFF';
      case 'delivered': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const renderOrder = ({ item }: { item: SupplierOrder }) => (
    <Pressable style={styles.orderCard} onPress={() => handleEditOrder(item)}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.orderText}>Ordered: {new Date(item.orderDate).toLocaleDateString()}</Text>
        </View>
        
        {item.expectedDelivery && (
          <View style={styles.orderRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.orderText}>Expected: {new Date(item.expectedDelivery).toLocaleDateString()}</Text>
          </View>
        )}
        
        <View style={styles.orderRow}>
          <Ionicons name="cube-outline" size={16} color="#666" />
          <Text style={styles.orderText}>{item.items.length} item{item.items.length !== 1 ? 's' : ''}</Text>
        </View>
        
        <View style={styles.orderRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.orderAmount}>${item.totalAmount.toFixed(2)}</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderProductSelector = ({ item }: { item: Product }) => {
    const quantity = selectedProducts[item.id] || 0;
    
    return (
      <View style={styles.productSelector}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCost}>${item.cost.toFixed(2)} each</Text>
        </View>
        
        <View style={styles.quantityControls}>
          <Pressable
            style={styles.quantityButton}
            onPress={() => updateProductQuantity(item.id, quantity - 1)}
          >
            <Ionicons name="remove" size={20} color="#007AFF" />
          </Pressable>
          
          <TextInput
            style={styles.quantityInput}
            value={quantity.toString()}
            onChangeText={(text) => updateProductQuantity(item.id, parseInt(text) || 0)}
            keyboardType="number-pad"
          />
          
          <Pressable
            style={styles.quantityButton}
            onPress={() => updateProductQuantity(item.id, quantity + 1)}
          >
            <Ionicons name="add" size={20} color="#007AFF" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Purchase Orders</Text>
        <Pressable style={styles.createButton} onPress={handleCreateOrder}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>New Order</Text>
        </Pressable>
      </View>

      {supplierOrders.length > 0 ? (
        <FlatList
          data={supplierOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#999" />
          <Text style={styles.emptyText}>No purchase orders yet</Text>
          <Text style={styles.emptySubtext}>Create your first order to get started</Text>
        </View>
      )}

      {/* Order Creation/Edit Modal */}
      <Modal
        visible={showOrderModal}
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowOrderModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingOrder ? 'Edit Order' : 'Create Order'}
            </Text>
            <Pressable onPress={handleSaveOrder} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Order Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Order Date</Text>
                <TextInput
                  style={styles.input}
                  value={orderData.orderDate}
                  onChangeText={(text) => setOrderData({ ...orderData, orderDate: text })}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expected Delivery</Text>
                <TextInput
                  style={styles.input}
                  value={orderData.expectedDelivery || ''}
                  onChangeText={(text) => setOrderData({ ...orderData, expectedDelivery: text })}
                  placeholder="YYYY-MM-DD (optional)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.statusSelector}>
                  {(['pending', 'shipped', 'delivered', 'cancelled'] as const).map(status => (
                    <Pressable
                      key={status}
                      style={[
                        styles.statusOption,
                        orderData.status === status && styles.statusOptionActive
                      ]}
                      onPress={() => setOrderData({ ...orderData, status })}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        orderData.status === status && styles.statusOptionTextActive
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={orderData.notes}
                  onChangeText={(text) => setOrderData({ ...orderData, notes: text })}
                  placeholder="Order notes..."
                  multiline
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Select Products</Text>
              <FlatList
                data={supplierProducts}
                renderItem={renderProductSelector}
                keyExtractor={(item) => item.id}
                style={styles.productList}
              />
            </View>

            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items:</Text>
                <Text style={styles.summaryValue}>
                  {Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount:</Text>
                <Text style={styles.summaryAmount}>
                  ${Object.entries(selectedProducts)
                    .reduce((sum, [productId, quantity]) => {
                      const product = products.find(p => p.id === productId);
                      return sum + (product ? product.cost * quantity : 0);
                    }, 0)
                    .toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    gap: 8,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  formSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  statusOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#666',
  },
  statusOptionTextActive: {
    color: 'white',
  },
  productList: {
    maxHeight: 300,
  },
  productSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  productCost: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 60,
    height: 32,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    textAlign: 'center',
    marginHorizontal: 8,
    fontSize: 16,
  },
  orderSummary: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
});