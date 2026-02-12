import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Promotion, PromotionType } from '../types';
import { createPromotion, updatePromotion } from '../lib/api';
import { PromotionTemplates } from '../lib/discountCalculator';
import CustomAlert from './CustomAlert';

interface PromotionFormProps {
  storeId: number;
  promotion?: Promotion | null;
  onClose: () => void;
}

export const PromotionForm: React.FC<PromotionFormProps> = ({
  storeId,
  promotion,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: promotion?.name || '',
    description: promotion?.description || '',
    type: promotion?.type || 'percentage' as PromotionType,
    discountValue: promotion?.discountValue?.toString() || '',
    minimumPurchase: promotion?.minimumPurchase?.toString() || '',
    maximumDiscount: promotion?.maximumDiscount?.toString() || '',
    buyQuantity: promotion?.buyQuantity?.toString() || '1',
    getQuantity: promotion?.getQuantity?.toString() || '1',
    getDiscountType: promotion?.getDiscountType || 'free',
    getDiscountValue: promotion?.getDiscountValue?.toString() || '',
    timeBasedType: promotion?.timeBasedType || 'daily',
    activeTimeStart: promotion?.activeTimeStart || '17:00:00',
    activeTimeEnd: promotion?.activeTimeEnd || '19:00:00',
    activeDays: promotion?.activeDays || [0, 6],
    discountCodes: promotion?.discountCodes ?
      (Array.isArray(promotion.discountCodes) && promotion.discountCodes.length > 0 && typeof promotion.discountCodes[0] === 'object' && 'code' in promotion.discountCodes[0]
        ? (promotion.discountCodes as any[]).map((codeObj: any) => codeObj.code || '').join(', ')
        : Array.isArray(promotion.discountCodes)
        ? promotion.discountCodes.join(', ')
        : ''
      ) : '',
    usageLimit: promotion?.usageLimit?.toString() || '',
    customerUsageLimit: promotion?.customerUsageLimit?.toString() || '',
    startDate: promotion?.startDate ? new Date(promotion.startDate) : new Date(),
    endDate: promotion?.endDate ? new Date(promotion.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      showAlert('Error', 'Please fill in all required fields', 'error');
      return;
    }

    if (!formData.discountCodes.trim()) {
      showAlert('Error', 'Please provide at least one discount code', 'error');
      return;
    }

    try {
      setLoading(true);

      const promotionData: Omit<Promotion, 'id' | 'createdAt' | 'updatedAt'> = {
        storeInfoId: storeId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        discountValue: parseFloat(formData.discountValue) || 0,
        minimumPurchase: formData.minimumPurchase ? parseFloat(formData.minimumPurchase) : undefined,
        maximumDiscount: formData.maximumDiscount ? parseFloat(formData.maximumDiscount) : undefined,
        buyQuantity: formData.type === 'buy_x_get_y' ? parseInt(formData.buyQuantity) : undefined,
        getQuantity: formData.type === 'buy_x_get_y' ? parseInt(formData.getQuantity) : undefined,
        getDiscountType: formData.type === 'buy_x_get_y' ? formData.getDiscountType as any : undefined,
        getDiscountValue: formData.type === 'buy_x_get_y' && formData.getDiscountType !== 'free' ? parseFloat(formData.getDiscountValue) : undefined,
        timeBasedType: formData.type === 'time_based' ? formData.timeBasedType as any : undefined,
        activeTimeStart: formData.type === 'time_based' ? formData.activeTimeStart : undefined,
        activeTimeEnd: formData.type === 'time_based' ? formData.activeTimeEnd : undefined,
        activeDays: formData.type === 'time_based' && formData.timeBasedType === 'weekly' ? formData.activeDays : undefined,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        discountCodes: formData.discountCodes.split(',').map((code: string) => code.trim()).filter((code: string) => code),
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        customerUsageLimit: formData.customerUsageLimit ? parseInt(formData.customerUsageLimit) : undefined,
        isActive: true,
      };

      if (promotion?.id) {
        await updatePromotion(promotion.id, promotionData);
      } else {
        await createPromotion(promotionData);
      }

      showAlert('Success', `Promotion ${promotion ? 'updated' : 'created'} successfully`, 'success');
      onClose();
    } catch (error) {
      console.error('Failed to save promotion:', error);
      showAlert('Error', `Failed to ${promotion ? 'update' : 'create'} promotion`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setCustomAlert({
      visible: false,
      title: '',
      message: '',
    });
  };

  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    if (pickerMode === 'start') {
      setFormData({ ...formData, startDate: selectedDate });
    } else {
      setFormData({ ...formData, endDate: selectedDate });
    }
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const showDatePickerFor = (mode: 'start' | 'end') => {
    if (Platform.OS !== 'web') {
      setPickerMode(mode);
      setShowDatePicker(true);
    }
  };

  const useTemplate = (templateType: string) => {
    switch (templateType) {
      case 'percentage':
        setFormData({
          ...formData,
          name: 'Summer Sale',
          description: 'Get 20% off on all items',
          type: 'percentage',
          discountValue: '20',
          minimumPurchase: '50',
          maximumDiscount: '100',
          discountCodes: 'SUMMER20, SAVE20',
        });
        break;
      case 'bogo':
        setFormData({
          ...formData,
          name: 'Buy 2 Get 1 Free',
          description: 'Buy any 2 items and get the 3rd one free',
          type: 'buy_x_get_y',
          buyQuantity: '2',
          getQuantity: '1',
          getDiscountType: 'free',
          discountCodes: 'BOGO2024',
        });
        break;
      case 'happyhour':
        setFormData({
          ...formData,
          name: 'Happy Hour Special',
          description: '15% off during happy hour',
          type: 'time_based',
          discountValue: '15',
          timeBasedType: 'daily',
          activeTimeStart: '17:00:00',
          activeTimeEnd: '19:00:00',
          discountCodes: 'HAPPYHOUR',
        });
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {promotion ? 'Edit Promotion' : 'Create Promotion'}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Quick Templates */}
        {!promotion && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Templates</Text>
            <View style={styles.templateButtons}>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => useTemplate('percentage')}
              >
                <Text style={styles.templateButtonText}>20% Off Sale</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => useTemplate('bogo')}
              >
                <Text style={styles.templateButtonText}>BOGO Offer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={() => useTemplate('happyhour')}
              >
                <Text style={styles.templateButtonText}>Happy Hour</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g., Summer Sale 2024"
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Describe your promotion"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Promotion Type</Text>
          <View style={styles.typeButtons}>
            {[
              { key: 'percentage', label: 'Percentage' },
              { key: 'fixed_amount', label: 'Fixed Amount' },
              { key: 'buy_x_get_y', label: 'BOGO' },
              { key: 'time_based', label: 'Time-Based' },
            ].map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  formData.type === type.key && styles.typeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, type: type.key as PromotionType })}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    formData.type === type.key && styles.typeButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Discount Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discount Settings</Text>

          {(formData.type === 'percentage' || formData.type === 'fixed_amount' || formData.type === 'time_based') && (
            <>
              <Text style={styles.label}>
                Discount Value ({formData.type === 'percentage' ? '%' : '$'}) *
              </Text>
              <TextInput
                style={styles.input}
                value={formData.discountValue}
                onChangeText={(text) => setFormData({ ...formData, discountValue: text })}
                placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                keyboardType="numeric"
              />
            </>
          )}

          {formData.type === 'buy_x_get_y' && (
            <>
              <Text style={styles.label}>Buy Quantity *</Text>
              <TextInput
                style={styles.input}
                value={formData.buyQuantity}
                onChangeText={(text) => setFormData({ ...formData, buyQuantity: text })}
                placeholder="2"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Get Quantity *</Text>
              <TextInput
                style={styles.input}
                value={formData.getQuantity}
                onChangeText={(text) => setFormData({ ...formData, getQuantity: text })}
                placeholder="1"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Get Discount Type</Text>
              <View style={styles.typeButtons}>
                {[
                  { key: 'free', label: 'Free' },
                  { key: 'percentage', label: 'Percentage' },
                  { key: 'fixed_amount', label: 'Fixed Amount' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      formData.getDiscountType === type.key && styles.typeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, getDiscountType: type.key as any })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.getDiscountType === type.key && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {formData.getDiscountType !== 'free' && (
                <>
                  <Text style={styles.label}>
                    Get Discount Value ({formData.getDiscountType === 'percentage' ? '%' : '$'})
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.getDiscountValue}
                    onChangeText={(text) => setFormData({ ...formData, getDiscountValue: text })}
                    placeholder={formData.getDiscountType === 'percentage' ? '50' : '5.00'}
                    keyboardType="numeric"
                  />
                </>
              )}
            </>
          )}

          {formData.type === 'time_based' && (
            <>
              <Text style={styles.label}>Time-Based Type</Text>
              <View style={styles.typeButtons}>
                {[
                  { key: 'daily', label: 'Daily' },
                  { key: 'weekly', label: 'Weekly' },
                  { key: 'specific_dates', label: 'Specific Dates' },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      formData.timeBasedType === type.key && styles.typeButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, timeBasedType: type.key as any })}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.timeBasedType === type.key && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Active Time Start (HH:MM:SS)</Text>
              <TextInput
                style={styles.input}
                value={formData.activeTimeStart}
                onChangeText={(text) => setFormData({ ...formData, activeTimeStart: text })}
                placeholder="17:00:00"
              />

              <Text style={styles.label}>Active Time End (HH:MM:SS)</Text>
              <TextInput
                style={styles.input}
                value={formData.activeTimeEnd}
                onChangeText={(text) => setFormData({ ...formData, activeTimeEnd: text })}
                placeholder="19:00:00"
              />
            </>
          )}

          <Text style={styles.label}>Minimum Purchase ($)</Text>
          <TextInput
            style={styles.input}
            value={formData.minimumPurchase}
            onChangeText={(text) => setFormData({ ...formData, minimumPurchase: text })}
            placeholder="50.00"
            keyboardType="numeric"
          />

          {formData.type === 'percentage' && (
            <>
              <Text style={styles.label}>Maximum Discount ($)</Text>
              <TextInput
                style={styles.input}
                value={formData.maximumDiscount}
                onChangeText={(text) => setFormData({ ...formData, maximumDiscount: text })}
                placeholder="100.00"
                keyboardType="numeric"
              />
            </>
          )}
        </View>

        {/* Codes and Limits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Codes & Limits</Text>

          <Text style={styles.label}>Discount Codes * (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.discountCodes}
            onChangeText={(text) => setFormData({ ...formData, discountCodes: text })}
            placeholder="SUMMER20, SAVE20"
          />

          <Text style={styles.label}>Total Usage Limit</Text>
          <TextInput
            style={styles.input}
            value={formData.usageLimit}
            onChangeText={(text) => setFormData({ ...formData, usageLimit: text })}
            placeholder="100"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Customer Usage Limit</Text>
          <TextInput
            style={styles.input}
            value={formData.customerUsageLimit}
            onChangeText={(text) => setFormData({ ...formData, customerUsageLimit: text })}
            placeholder="1"
            keyboardType="numeric"
          />
        </View>

        {/* Validity Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validity Period</Text>

          <Text style={styles.label}>Start Date</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: '#fff',
                width: '100%',
                boxSizing: 'border-box',
              }}
              value={formData.startDate.toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
            />
          ) : (
            <TouchableOpacity
              style={styles.input}
              onPress={() => showDatePickerFor('start')}
            >
              <Text style={styles.dateText}>
                {formData.startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>End Date</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                backgroundColor: '#fff',
                width: '100%',
                boxSizing: 'border-box',
              }}
              value={formData.endDate.toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
            />
          ) : (
            <TouchableOpacity
              style={styles.input}
              onPress={() => showDatePickerFor('end')}
            >
              <Text style={styles.dateText}>
                {formData.endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Saving...' : promotion ? 'Update Promotion' : 'Create Promotion'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {Platform.OS !== 'web' && (
        <DatePicker
          modal
          open={showDatePicker}
          date={pickerMode === 'start' ? formData.startDate : formData.endDate}
          onConfirm={handleDateConfirm}
          onCancel={handleDateCancel}
          mode="date"
        />
      )}

      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        type={customAlert.type}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  templateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  templateButtonText: {
    color: '#333',
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  typeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    color: '#333',
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});