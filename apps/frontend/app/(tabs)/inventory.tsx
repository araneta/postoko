import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useStore from '@/store/useStore';
import {
  getStockSummary,
  getLowStockProducts,
  getMovementsByStore,
} from '@/lib/api';
import {
  InventorySummary,
  LowStockResponse,
  InventoryMovementsResponse,
  InventoryMovement,
  AdjustStockRequest,
  RecordMovementRequest,
  InventoryMovementType,
} from '@/types';

export default function InventoryScreen() {
  const { products, formatPrice, adjustInventoryStock, recordInventoryMovement } = useStore();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [lowStock, setLowStock] = useState<LowStockResponse | null>(null);
  const [movements, setMovements] = useState<InventoryMovementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'lowstock' | 'movements'>('summary');
  const [movementFilter, setMovementFilter] = useState<string>('');
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newStock, setNewStock] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      console.log('Loading inventory data...');
      const [summaryData, lowStockData, movementsData] = await Promise.all([
        getStockSummary(),
        getLowStockProducts(),
        getMovementsByStore(),
      ]);
      console.log('Summary data:', summaryData);
      console.log('Low stock data:', lowStockData);
      console.log('Movements data:', movementsData);
      setSummary(summaryData);
      setLowStock(lowStockData);
      setMovements(movementsData);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
      console.log('Using mock data for demonstration...');
      
      // Mock data for demonstration
      const mockSummary = {
        stock: {
          totalProducts: products.length,
          totalQuantity: products.reduce((sum, p) => sum + p.stock, 0),
          totalValue: products.reduce((sum, p) => sum + (p.stock * p.price), 0),
          lowStockCount: products.filter(p => p.stock <= (p.minStock || 5)).length,
          outOfStockCount: products.filter(p => p.stock === 0).length,
        },
        todayMovements: {
          sales: 0,
          purchases: 0,
          returns: 0,
          adjustments: 0,
        },
      };
      
      const mockLowStock = {
        lowStockCount: products.filter(p => p.stock <= (p.minStock || 5)).length,
        products: products.filter(p => p.stock <= (p.minStock || 5)).map(p => ({
          id: p.id,
          name: p.name,
          currentStock: p.stock,
          minStock: p.minStock || 5,
          categoryName: p.categoryName,
        })),
      };
      
      const mockMovements = {
        movements: [
          {
            id: '1',
            productId: products[0]?.id || 'demo-1',
            type: 'adjustment' as const,
            quantity: 50,
            referenceId: 'initial-stock',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '2', 
            productId: products[1]?.id || 'demo-2',
            type: 'adjustment' as const,
            quantity: 30,
            referenceId: 'initial-stock',
            createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            updatedAt: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: '3',
            productId: products[2]?.id || 'demo-3', 
            type: 'adjustment' as const,
            quantity: 100,
            referenceId: 'initial-stock',
            createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            updatedAt: new Date(Date.now() - 259200000).toISOString(),
          },
        ],
        total: 3,
        limit: 100,
        offset: 0,
      };
      
      setSummary(mockSummary);
      setLowStock(mockLowStock);
      setMovements(mockMovements);
      
      // Only show alert if it's not a network error
      if (error instanceof Error && !error.message.includes('Network request failed')) {
        Alert.alert('Info', 'Using demo data - Backend API not available');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventoryData();
    setRefreshing(false);
  };

  const loadMovements = async (type?: string) => {
    try {
      console.log('Loading movements with type:', type);
      const movementsData = await getMovementsByStore(type);
      console.log('Raw movements response:', JSON.stringify(movementsData, null, 2));
      
      // Handle different possible response structures
      let movementsArray = [];
      if (movementsData) {
        if (Array.isArray(movementsData)) {
          // Direct array response
          movementsArray = movementsData;
        } else if ((movementsData as any).movements && Array.isArray((movementsData as any).movements)) {
          // Object with movements array
          movementsArray = (movementsData as any).movements;
        } else if ((movementsData as any).data && Array.isArray((movementsData as any).data)) {
          // Object with data array
          movementsArray = (movementsData as any).data;
        }
      }
      
      console.log('Processed movements array:', movementsArray);
      console.log('Movements length:', movementsArray.length);
      
      // Normalize to expected structure
      const normalizedResponse = {
        movements: movementsArray,
        total: movementsArray.length,
        limit: 100,
        offset: 0,
      };
      
      setMovements(normalizedResponse);
    } catch (error) {
      console.error('Failed to load movements:', error);
      Alert.alert('Error', 'Failed to load movements');
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct || !newStock) {
      Alert.alert('Error', 'Please select a product and enter new stock amount');
      return;
    }

    try {
      const adjustment: AdjustStockRequest = {
        productId: selectedProduct.id,
        newStock: parseInt(newStock),
        reason: adjustReason,
      };
      await adjustInventoryStock(adjustment);
      Alert.alert('Success', 'Stock adjusted successfully');
      setAdjustModalVisible(false);
      setNewStock('');
      setAdjustReason('');
      setSelectedProduct(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      Alert.alert('Error', 'Failed to adjust stock');
    }
  };

  const getCurrentStockForProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.stock : selectedProduct?.currentStock || selectedProduct?.stock || 'N/A';
  };

  const handleMovementFilter = (type: string) => {
    setMovementFilter(type);
    loadMovements(type);
  };

  const getMovementTypeColor = (type: InventoryMovementType) => {
    switch (type) {
      case 'sale':
        return '#FF3B30';
      case 'purchase':
        return '#34C759';
      case 'adjustment':
        return '#FF9500';
      case 'return':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getMovementTypeIcon = (type: InventoryMovementType) => {
    switch (type) {
      case 'sale':
        return 'cart-outline';
      case 'purchase':
        return 'add-circle-outline';
      case 'adjustment':
        return 'create-outline';
      case 'return':
        return 'arrow-undo-outline';
      default:
        return 'help-outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading inventory data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>
            Summary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lowstock' && styles.activeTab]}
          onPress={() => setActiveTab('lowstock')}
        >
          <Text style={[styles.tabText, activeTab === 'lowstock' && styles.activeTabText]}>
            Low Stock ({lowStock?.lowStockCount || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'movements' && styles.activeTab]}
          onPress={() => setActiveTab('movements')}
        >
          <Text style={[styles.tabText, activeTab === 'movements' && styles.activeTabText]}>
            Movements
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'summary' && summary && (
          <View>
            {/* Header with Refresh Button */}
            <View style={styles.headerContainer}>
              <Text style={styles.sectionTitle}>Inventory Summary</Text>
              <TouchableOpacity 
                style={styles.headerRefreshButton} 
                onPress={onRefresh}
                disabled={refreshing}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={refreshing ? "#8E8E93" : "#ffffff"} 
                  style={{ transform: [{ rotate: refreshing ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
            </View>

            {/* Stock Overview Cards */}
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Total Products</Text>
                <Text style={styles.cardValue}>{summary.stock.totalProducts}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Total Quantity</Text>
                <Text style={styles.cardValue}>{summary.stock.totalQuantity}</Text>
              </View>
            </View>

            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Total Value</Text>
                <Text style={styles.cardValue}>{formatPrice(summary.stock.totalValue)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Low Stock</Text>
                <Text style={[styles.cardValue, { color: '#FF3B30' }]}>
                  {summary.stock.lowStockCount}
                </Text>
              </View>
            </View>

            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Out of Stock</Text>
                <Text style={[styles.cardValue, { color: '#FF3B30' }]}>
                  {summary.stock.outOfStockCount}
                </Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Avg. Value/Item</Text>
                <Text style={styles.cardValue}>
                  {formatPrice(summary.stock.totalQuantity > 0 ? summary.stock.totalValue / summary.stock.totalQuantity : 0)}
                </Text>
              </View>
            </View>

            {/* Today's Movements */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Movements</Text>
              <View style={styles.movementSummary}>
                <View style={styles.movementItem}>
                  <Ionicons name="cart-outline" size={20} color="#FF3B30" />
                  <Text style={styles.movementLabel}>Sales</Text>
                  <Text style={styles.movementValue}>{summary.todayMovements.sales}</Text>
                </View>
                <View style={styles.movementItem}>
                  <Ionicons name="add-circle-outline" size={20} color="#34C759" />
                  <Text style={styles.movementLabel}>Purchases</Text>
                  <Text style={styles.movementValue}>{summary.todayMovements.purchases}</Text>
                </View>
                <View style={styles.movementItem}>
                  <Ionicons name="arrow-undo-outline" size={20} color="#007AFF" />
                  <Text style={styles.movementLabel}>Returns</Text>
                  <Text style={styles.movementValue}>{summary.todayMovements.returns}</Text>
                </View>
                <View style={styles.movementItem}>
                  <Ionicons name="create-outline" size={20} color="#FF9500" />
                  <Text style={styles.movementLabel}>Adjustments</Text>
                  <Text style={styles.movementValue}>{summary.todayMovements.adjustments}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'lowstock' && lowStock && (
          <View>
            {/* Header with Refresh Button */}
            <View style={styles.headerContainer}>
              <Text style={styles.sectionTitle}>Low Stock Products</Text>
              <TouchableOpacity 
                style={styles.headerRefreshButton} 
                onPress={onRefresh}
                disabled={refreshing}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={refreshing ? "#8E8E93" : "#007AFF"} 
                  style={{ transform: [{ rotate: refreshing ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
            </View>
            {lowStock.products.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#34C759" />
                <Text style={styles.emptyStateText}>All products are well stocked!</Text>
              </View>
            ) : (
              lowStock.products.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCategory}>{product.categoryName}</Text>
                  </View>
                  <View style={styles.stockInfo}>
                    <Text style={styles.currentStock}>Current: {product.currentStock}</Text>
                    <Text style={styles.minStock}>Min: {product.minStock}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.adjustButton}
                    onPress={() => {
                      setSelectedProduct(product);
                      setAdjustModalVisible(true);
                    }}
                  >
                    <Ionicons name="create" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'movements' && movements && (
          <View>
            {/* Movement Type Filter */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  movementFilter === '' && styles.activeFilter,
                ]}
                onPress={() => handleMovementFilter('')}
              >
                <Text style={styles.filterText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  movementFilter === 'sale' && styles.activeFilter,
                ]}
                onPress={() => handleMovementFilter('sale')}
              >
                <Text style={styles.filterText}>Sales</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  movementFilter === 'purchase' && styles.activeFilter,
                ]}
                onPress={() => handleMovementFilter('purchase')}
              >
                <Text style={styles.filterText}>Purchases</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  movementFilter === 'adjustment' && styles.activeFilter,
                ]}
                onPress={() => handleMovementFilter('adjustment')}
              >
                <Text style={styles.filterText}>Adjustments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  movementFilter === 'return' && styles.activeFilter,
                ]}
                onPress={() => handleMovementFilter('return')}
              >
                <Text style={styles.filterText}>Returns</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.headerContainer}>
              <Text style={styles.sectionTitle}>Recent Movements</Text>
              <TouchableOpacity 
                style={styles.headerRefreshButton} 
                onPress={() => loadMovements(movementFilter)}
                disabled={refreshing}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={refreshing ? "#8E8E93" : "#007AFF"} 
                  style={{ transform: [{ rotate: refreshing ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
            </View>

            {!movements || !movements.movements || movements.movements.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="list" size={48} color="#8E8E93" />
                <Text style={styles.emptyStateText}>No movements found</Text>
              </View>
            ) : (
              movements.movements.map((movement) => {
                const product = products.find((p) => p.id === movement.productId);
                return (
                  <View key={movement.id} style={styles.movementCard}>
                    <View style={styles.movementHeader}>
                      <View style={styles.movementType}>
                        <Ionicons
                          name={getMovementTypeIcon(movement.type)}
                          size={20}
                          color={getMovementTypeColor(movement.type)}
                        />
                        <Text
                          style={[
                            styles.movementTypeText,
                            { color: getMovementTypeColor(movement.type) },
                          ]}
                        >
                          {movement.type.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.movementDate}>
                        {formatDate(movement.createdAt)} {formatTime(movement.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.movementDetails}>
                      <Text style={styles.movementProduct}>{product?.name || 'Unknown Product'}</Text>
                      <Text
                        style={[
                          styles.movementQuantity,
                          movement.quantity < 0 ? styles.negativeQuantity : styles.positiveQuantity,
                        ]}
                      >
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </Text>
                    </View>
                    {movement.referenceId && (
                      <Text style={styles.movementReference}>
                        Reference: {movement.referenceId}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Adjust Stock Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={adjustModalVisible}
        onRequestClose={() => setAdjustModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Stock</Text>
              <TouchableOpacity onPress={() => setAdjustModalVisible(false)}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            {selectedProduct && (
              <View>
                <Text style={styles.modalProduct}>{selectedProduct.name}</Text>
                <Text style={styles.modalCurrentStock}>
                  Current Stock: {getCurrentStockForProduct(selectedProduct.id)}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="New Stock Amount"
                  value={newStock}
                  onChangeText={setNewStock}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Reason (optional)"
                  value={adjustReason}
                  onChangeText={setAdjustReason}
                  multiline
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setAdjustModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.confirmButton]}
                    onPress={handleAdjustStock}
                  >
                    <Text style={styles.confirmButtonText}>Adjust Stock</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  movementSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  movementLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  movementValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  productCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  productCategory: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  stockInfo: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  currentStock: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  minStock: {
    fontSize: 12,
    color: '#8E8E93',
  },
  adjustButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E5E7',
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#000',
  },
  movementCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  movementType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  movementTypeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  movementDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  movementDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  movementProduct: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  movementQuantity: {
    fontSize: 16,
    fontWeight: '600',
  },
  negativeQuantity: {
    color: '#FF3B30',
  },
  positiveQuantity: {
    color: '#34C759',
  },
  movementReference: {
    fontSize: 12,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  modalProduct: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  modalCurrentStock: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
  },
  refreshContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerRefreshButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F7',
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});
