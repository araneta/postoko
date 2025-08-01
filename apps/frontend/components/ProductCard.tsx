import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Product } from '../types';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../store/useStore';
import stockAlertService from '../lib/stockAlerts';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  showAddToCart?: boolean;
}

export default function ProductCard({ product, onPress, showAddToCart = true }: ProductCardProps) {
  const { formatPrice } = useStore();
  const isLowStock = stockAlertService.checkLowStockAlert(product);

  return (
    <Pressable onPress={onPress} style={[styles.card, isLowStock && styles.lowStockCard]}>
      <Image
        source={{
          uri: product.image || 'https://images.unsplash.com/photo-1612837017391-4b6b7b0b0b0b?ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZHVjdHxlbnwwfHwwfHw%3D&ixlib=rb-1.2.1&w=1000&q=80',
        }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <View style={styles.stockContainer}>
          <Text style={[styles.stock, isLowStock && styles.lowStockText]}>
            In Stock: {product.stock}
          </Text>
          {isLowStock && (
            <View style={styles.lowStockIndicator}>
              <Ionicons name="warning" size={12} color="#FF9800" />
              <Text style={styles.lowStockLabel}>Low Stock</Text>
            </View>
          )}
        </View>
        {product.barcode && (
          <Text style={styles.barcode}>Barcode: {product.barcode}</Text>
        )}
      </View>
      {showAddToCart && (
        <View style={styles.addButton}>
          <Ionicons name="add-circle" size={24} color="#007AFF" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  lowStockCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  image: {
    width: 80,
    height: 80,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stock: {
    fontSize: 12,
    color: '#666',
  },
  lowStockText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  lowStockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lowStockLabel: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 2,
  },
  barcode: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    justifyContent: 'center',
    paddingRight: 12,
  },
});