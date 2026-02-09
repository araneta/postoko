import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Supplier, Product } from '../types';

interface SupplierAnalyticsProps {
  supplier: Supplier;
  products: Product[];
}

export default function SupplierAnalytics({ supplier, products }: SupplierAnalyticsProps) {
  const supplierProducts = products.filter(product => product.supplierId === supplier.id);
  
  // Calculate analytics
  const totalProducts = supplierProducts.length;
  const totalInventoryValue = supplierProducts.reduce((sum, product) => sum + (product.cost * product.stock), 0);
  const averageProductCost = totalProducts > 0 ? totalInventoryValue / supplierProducts.reduce((sum, product) => sum + product.stock, 0) : 0;
  const lowStockProducts = supplierProducts.filter(product => product.minStock && product.stock <= product.minStock);
  const outOfStockProducts = supplierProducts.filter(product => product.stock === 0);

  const renderMetricCard = (title: string, value: string | number, icon: string, color: string = '#007AFF') => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="white" />
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
    </View>
  );

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
        <Text style={styles.ratingText}>({rating}/5)</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Supplier Analytics</Text>
        <Text style={styles.supplierName}>{supplier.name}</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          {renderMetricCard('Total Products', totalProducts, 'cube-outline')}
          {renderMetricCard('Inventory Value', `$${totalInventoryValue.toFixed(2)}`, 'cash-outline', '#34C759')}
          {renderMetricCard('Avg. Cost', `$${averageProductCost.toFixed(2)}`, 'trending-up-outline', '#FF9500')}
          {renderMetricCard('Low Stock Items', lowStockProducts.length, 'warning-outline', '#FF3B30')}
        </View>
      </View>

      {/* Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceCard}>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Rating:</Text>
            {renderStars(supplier.rating)}
          </View>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(supplier.status) }]}>
              <Text style={styles.statusText}>{supplier.status.toUpperCase()}</Text>
            </View>
          </View>
          {supplier.paymentTerms && (
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Payment Terms:</Text>
              <Text style={styles.performanceValue}>{supplier.paymentTerms}</Text>
            </View>
          )}
          {supplier.creditLimit && (
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Credit Limit:</Text>
              <Text style={styles.performanceValue}>${supplier.creditLimit.toLocaleString()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stock Alerts */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Alerts</Text>
          {outOfStockProducts.length > 0 && (
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                <Text style={[styles.alertTitle, { color: '#FF3B30' }]}>Out of Stock ({outOfStockProducts.length})</Text>
              </View>
              {outOfStockProducts.slice(0, 3).map(product => (
                <Text key={product.id} style={styles.alertProduct}>• {product.name}</Text>
              ))}
              {outOfStockProducts.length > 3 && (
                <Text style={styles.alertMore}>+{outOfStockProducts.length - 3} more items</Text>
              )}
            </View>
          )}
          
          {lowStockProducts.length > 0 && (
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Ionicons name="warning" size={20} color="#FF9500" />
                <Text style={[styles.alertTitle, { color: '#FF9500' }]}>Low Stock ({lowStockProducts.length})</Text>
              </View>
              {lowStockProducts.slice(0, 3).map(product => (
                <Text key={product.id} style={styles.alertProduct}>
                  • {product.name} ({product.stock} left, min: {product.minStock})
                </Text>
              ))}
              {lowStockProducts.length > 3 && (
                <Text style={styles.alertMore}>+{lowStockProducts.length - 3} more items</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Product Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Breakdown</Text>
        {supplierProducts.length > 0 ? (
          supplierProducts.map(product => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productCost}>${product.cost.toFixed(2)}</Text>
              </View>
              <View style={styles.productDetails}>
                <Text style={styles.productStock}>Stock: {product.stock}</Text>
                <Text style={styles.productValue}>
                  Value: ${(product.cost * product.stock).toFixed(2)}
                </Text>
              </View>
              {product.minStock && product.stock <= product.minStock && (
                <View style={styles.productAlert}>
                  <Ionicons name="warning" size={16} color="#FF9500" />
                  <Text style={styles.productAlertText}>Low stock warning</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>No products assigned to this supplier</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return '#34C759';
    case 'inactive': return '#FF3B30';
    case 'pending': return '#FF9500';
    default: return '#8E8E93';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  supplierName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    marginBottom: 8,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  metricTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  performanceCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  performanceValue: {
    fontSize: 16,
    color: '#666',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noRating: {
    fontSize: 14,
    color: '#999',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
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
  alertCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  alertProduct: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  alertMore: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  productCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  productCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productStock: {
    fontSize: 14,
    color: '#666',
  },
  productValue: {
    fontSize: 14,
    color: '#666',
  },
  productAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  productAlertText: {
    fontSize: 14,
    color: '#FF9500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});