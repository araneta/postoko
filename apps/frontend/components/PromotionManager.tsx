import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Promotion } from '../types';
import { getPromotions, deletePromotion } from '../lib/api';
import { PromotionForm } from './PromotionForm';
import { PromotionCard } from './PromotionCard';

interface PromotionManagerProps {
  storeId: number;
}

export const PromotionManager: React.FC<PromotionManagerProps> = ({ storeId }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    loadPromotions();
  }, [storeId]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await getPromotions(storeId);
      setPromotions(data);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      Alert.alert('Error', 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    Alert.alert(
      'Delete Promotion',
      'Are you sure you want to delete this promotion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePromotion(promotionId);
              await loadPromotions();
            } catch (error) {
              console.error('Failed to delete promotion:', error);
              Alert.alert('Error', 'Failed to delete promotion');
            }
          }
        }
      ]
    );
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPromotion(null);
    loadPromotions();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading promotions...</Text>
      </View>
    );
  }

  if (showForm) {
    return (
      <PromotionForm
        storeId={storeId}
        promotion={editingPromotion}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Promotions & Discounts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.addButtonText}>+ Add Promotion</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {promotions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No promotions created yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first promotion to start offering discounts
            </Text>
          </View>
        ) : (
          promotions.map((promotion) => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              onEdit={() => handleEditPromotion(promotion)}
              onDelete={() => handleDeletePromotion(promotion.id!)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});