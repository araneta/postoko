import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Product } from '../types';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../store/useStore';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  showAddToCart?: boolean;
}

export default function ProductCard({ product, onPress, showAddToCart = true }: ProductCardProps) {
  const { formatPrice } = useStore();

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image
        source={{
          uri: product.image || 'https://images.unsplash.com/photo-1612837017391-4b6b7b0b0b0b?ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZHVjdHxlbnwwfHwwfHw%3D&ixlib=rb-1.2.1&w=1000&q=80',
        }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.stock}>In Stock: {product.stock}</Text>
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
  stock: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    justifyContent: 'center',
    paddingRight: 12,
  },
});