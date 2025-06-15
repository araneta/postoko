import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Product} from '../types';
import {useStore} from '../store/useStore';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  showAddToCart?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  showAddToCart = true,
}) => {
  const formatPrice = useStore(state => state.formatPrice);

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Image
        source={{
          uri:
            product.image ||
            'https://images.pexels.com/photos/4109743/pexels-photo-4109743.jpeg?auto=compress&cs=tinysrgb&w=400',
        }}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Text style={styles.stock}>Stock: {product.stock}</Text>
        <Text style={styles.category}>{product.category}</Text>
      </View>
      {showAddToCart && (
        <View style={styles.addButton}>
          <Icon name="add-circle" size={28} color="#007AFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 120,
  },
  image: {
    width: 100,
    height: 120,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '700',
    marginBottom: 4,
  },
  stock: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  addButton: {
    justifyContent: 'center',
    paddingRight: 16,
  },
});

export default ProductCard;