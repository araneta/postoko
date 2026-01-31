import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function CategoryCard({ 
  category, 
  onPress, 
  onEdit, 
  onDelete, 
  showActions = true 
}: CategoryCardProps) {
  return (
    <Pressable 
      style={styles.container} 
      onPress={onPress}
      android_ripple={{ color: '#f0f0f0' }}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name}>{category.name}</Text>
          {category.description ? (
  <Text style={styles.description}>{category.description}</Text>
) : null}
        </View>
        
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <Pressable 
                style={styles.actionButton} 
                onPress={onEdit}
                hitSlop={8}
              >
                <Ionicons name="pencil" size={20} color="#007AFF" />
              </Pressable>
            )}
            {onDelete && (
              <Pressable 
                style={styles.actionButton} 
                onPress={onDelete}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});