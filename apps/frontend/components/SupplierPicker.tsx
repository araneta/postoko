import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Supplier } from '../types';

interface SupplierPickerProps {
  suppliers: Supplier[];
  selectedSupplierId?: string;
  onSupplierChange: (supplierId: string, supplierName: string) => void;
  placeholder?: string;
  style?: any;
}

export default function SupplierPicker({
  suppliers,
  selectedSupplierId,
  onSupplierChange,
  placeholder = 'Select a supplier',
  style,
}: SupplierPickerProps) {
  console.log('SupplierPicker: received suppliers:', suppliers?.length || 0, suppliers);
  
  return (
    <View style={[styles.container, style]}>
      <Picker
        selectedValue={selectedSupplierId}
        onValueChange={(itemValue, itemIndex) => {
          const selectedSupplier = suppliers.find((supplier) => supplier.id === itemValue);
          if (selectedSupplier) {
            onSupplierChange(selectedSupplier.id, selectedSupplier.name);
          }
        }}
        style={styles.picker}
      >
        <Picker.Item label={placeholder} value={undefined} />
        {suppliers.map((supplier) => (
          <Picker.Item key={supplier.id} label={supplier.name} value={supplier.id} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
});