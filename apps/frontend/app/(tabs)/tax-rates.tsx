import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTaxRates, createTaxRate, updateTaxRate, deleteTaxRate, getDefaultTaxRate } from '../../lib/api';
import { TaxRate } from '../../types';
import CustomAlert from '../../components/CustomAlert';

export default function TaxRatesScreen() {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    isDefault: false,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTaxRates();
  }, []);

  const loadTaxRates = async () => {
    try {
      setLoading(true);
      const rates = await getTaxRates();
      setTaxRates(rates);
    } catch (err) {
      setError('Failed to load tax rates');
      console.error('Error loading tax rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTaxRate(null);
    setFormData({
      name: '',
      rate: '',
      isDefault: false,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (taxRate: TaxRate) => {
    setEditingTaxRate(taxRate);
    setFormData({
      name: taxRate.name,
      rate: taxRate.rate.toString(),
      isDefault: taxRate.isDefault,
      isActive: taxRate.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Tax rate name is required');
      return;
    }

    const rate = parseFloat(formData.rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      Alert.alert('Error', 'Tax rate must be between 0 and 100');
      return;
    }

    try {
      setSaving(true);
      
      if (editingTaxRate) {
        await updateTaxRate(editingTaxRate.id, {
          name: formData.name.trim(),
          rate,
          isDefault: formData.isDefault,
          isActive: formData.isActive,
        });
      } else {
        await createTaxRate({
          name: formData.name.trim(),
          rate,
          isDefault: formData.isDefault,
          isActive: formData.isActive,
        });
      }

      setShowModal(false);
      loadTaxRates();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save tax rate');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (taxRate: TaxRate) => {
    Alert.alert(
      'Delete Tax Rate',
      `Are you sure you want to delete "${taxRate.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTaxRate(taxRate.id);
              loadTaxRates();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete tax rate');
            }
          },
        },
      ]
    );
  };

  const renderTaxRate = ({ item }: { item: TaxRate }) => (
    <View style={styles.taxRateItem}>
      <View style={styles.taxRateInfo}>
        <View style={styles.taxRateHeader}>
          <Text style={styles.taxRateName}>{item.name}</Text>
          <View style={styles.badges}>
            {item.isDefault && (
              <View style={[styles.badge, styles.defaultBadge]}>
                <Text style={styles.badgeText}>Default</Text>
              </View>
            )}
            {item.isActive ? (
              <View style={[styles.badge, styles.activeBadge]}>
                <Text style={styles.badgeText}>Active</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.inactiveBadge]}>
                <Text style={styles.badgeText}>Inactive</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.taxRateValue}>{parseFloat(item.rate.toString()).toFixed(2)}%</Text>
      </View>
      <View style={styles.taxRateActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="pencil" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tax rates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tax Rates</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {error && (
        <CustomAlert
          visible={!!error}
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      <FlatList
        data={taxRates}
        renderItem={renderTaxRate}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tax rates found</Text>
            <Text style={styles.emptySubtext}>Add your first tax rate to get started</Text>
          </View>
        }
      />

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingTaxRate ? 'Edit Tax Rate' : 'Add Tax Rate'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={styles.saveButton}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., VAT, Sales Tax"
                editable={!saving}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={formData.rate}
                onChangeText={(text) => setFormData({ ...formData, rate: text })}
                placeholder="0.00"
                keyboardType="numeric"
                editable={!saving}
              />
            </View>

            <View style={styles.switchGroup}>
              <View style={styles.switchItem}>
                <Text style={styles.switchLabel}>Default Tax Rate</Text>
                <Switch
                  value={formData.isDefault}
                  onValueChange={(value) => setFormData({ ...formData, isDefault: value })}
                  disabled={saving}
                />
              </View>

              <View style={styles.switchItem}>
                <Text style={styles.switchLabel}>Active</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                  disabled={saving}
                />
              </View>
            </View>
          </ScrollView>
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
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  taxRateItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taxRateInfo: {
    flex: 1,
  },
  taxRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taxRateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  defaultBadge: {
    backgroundColor: '#007AFF',
  },
  activeBadge: {
    backgroundColor: '#34C759',
  },
  inactiveBadge: {
    backgroundColor: '#8E8E93',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  taxRateValue: {
    fontSize: 16,
    color: '#666',
  },
  taxRateActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  switchGroup: {
    marginBottom: 20,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
});
