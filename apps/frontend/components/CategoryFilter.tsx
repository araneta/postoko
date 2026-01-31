import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId?: string;
  onCategorySelect: (categoryId?: string) => void;
  showAllOption?: boolean;
}

export default function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategorySelect,
  showAllOption = true
}: CategoryFilterProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {showAllOption && (
          <Pressable
            style={[
              styles.filterChip,
              !selectedCategoryId && styles.filterChipActive
            ]}
            onPress={() => onCategorySelect(undefined)}
          >
            <Ionicons 
              name="grid-outline" 
              size={16} 
              color={!selectedCategoryId ? '#fff' : '#007AFF'} 
            />
            <Text style={[
              styles.filterText,
              !selectedCategoryId && styles.filterTextActive
            ]}>
              All Categories
            </Text>
          </Pressable>
        )}
        
        {categories.map((category) => (
          <Pressable
            key={category.id.toString()}
            style={[
              styles.filterChip,
              selectedCategoryId === category.id.toString() && styles.filterChipActive
            ]}
            onPress={() => onCategorySelect(category.id.toString())}
          >
            <Text style={[
              styles.filterText,
              selectedCategoryId === category.id.toString() && styles.filterTextActive
            ]}>
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  filterTextActive: {
    color: '#fff',
  },
});