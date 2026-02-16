import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Promotion } from '../types';
import { getPromotions, deletePromotion } from '../lib/api';
import { PromotionForm } from './PromotionForm';
import { PromotionCard } from './PromotionCard';
import CustomAlert from './CustomAlert';

interface PromotionManagerProps {
  storeId: number;
}

export const PromotionManager: React.FC<PromotionManagerProps> = ({ storeId }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onClose: () => {},
    onConfirm: () => {},  
    showCancel: false,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });

  const showAlert = (
  title: string,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  options?: {
    showCancel?: boolean;
    onConfirm?: () => Promise<void> | void;
    confirmText?: string;
    cancelText?: string;
  }
) => {
  setCustomAlert({
    visible: true,
    title,
    message,
    type,
    onClose: hideAlert,
    onConfirm: options?.onConfirm ?? (() => {}),
    showCancel: options?.showCancel ?? false,
    confirmText: options?.confirmText ?? 'Confirm',
    cancelText: options?.cancelText ?? 'Cancel',
  });
};

  const hideAlert = () => {
    setCustomAlert({
      visible: false,
      title: '',
      message: '',
      type: 'info', 
      onClose: () => {},
      onConfirm: () => Promise.resolve(), 
      showCancel: false,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
    });
  };

  useEffect(() => {
    loadPromotions();
  }, [storeId]);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const data = await getPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      showAlert('Error', 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotion = (promotionId: string) => {
    showAlert(
      'Delete Promotion',
      'Are you sure you want to delete this promotion?',
      'warning',
      {
        showCancel: true,
        onConfirm: async () => {
          try {
            console.log('Deleting promotion with ID:', promotionId);
            await deletePromotion(promotionId);
            await loadPromotions();
            hideAlert();
            showAlert('Success', 'Promotion deleted successfully', 'success');
          } catch (error) {
            console.error('Failed to delete promotion:', error);
            hideAlert();
            showAlert('Error', 'Failed to delete promotion', 'error');
          }
        },
      }
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
      <CustomAlert
              visible={customAlert.visible}
              title={customAlert.title}
              message={customAlert.message}
              type={customAlert.type}
              showCancel={customAlert.showCancel}
              onConfirm={customAlert.onConfirm}
              onClose={hideAlert}
            />
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