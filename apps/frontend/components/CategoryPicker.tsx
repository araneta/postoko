import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Category } from '../types';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId?: string;
  onCategoryChange: (categoryId: string, categoryName: string) => void;
  placeholder?: string;
  style?: any;
}

export default function CategoryPicker({
  categories,
  selectedCategoryId,
  onCategoryChange,
  placeholder = "Select a category",
  style
}: CategoryPickerProps) {
  const handleValueChange = (categoryId: string) => {
    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        onCategoryChange(categoryId, category.name);
      }
    } else {
      onCategoryChange('', '');
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategoryId || ''}
          onValueChange={handleValueChange}
          style={styles.picker}
        >
          <Picker.Item 
            label={placeholder} 
            value="" 
            color="#999"
          />
          {categories.map((category) => (
            <Picker.Item
              key={category.id}
              label={category.name}
              value={category.id}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
});