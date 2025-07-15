import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentConfig, PaymentMethod } from '../types';
import useStore from '../store/useStore';

interface PaymentSettingsProps {
  onClose: () => void;
}

export default function PaymentSettings({ onClose }: PaymentSettingsProps) {
  const { settings, updatePaymentConfig } = useStore();
  const [isEnabled, setIsEnabled] = useState(settings.payment?.enabled || false);
  const [publishableKey, setPublishableKey] = useState(settings.payment?.stripePublishableKey || '');
  const [secretKey, setSecretKey] = useState(settings.payment?.stripeSecretKey || '');
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>(
    settings.payment?.paymentMethods || ['cash']
  );
  const [isSaving, setIsSaving] = useState(false);

  const paymentMethodOptions = [
    { id: 'cash', name: 'Cash', icon: 'cash-outline', color: '#34C759' },
    { id: 'card', name: 'Credit/Debit Cards', icon: 'card-outline', color: '#007AFF' },
    { id: 'digital_wallet', name: 'Digital Wallets', icon: 'phone-portrait-outline', color: '#FF9500' },
  ];

  const handleSave = async () => {
    if (isEnabled && !publishableKey.trim()) {
      Alert.alert('Missing Key', 'Please enter your Stripe Publishable Key to enable payments.');
      return;
    }

    if (isEnabled && !secretKey.trim()) {
      Alert.alert('Missing Key', 'Please enter your Stripe Secret Key to enable payments.');
      return;
    }

    if (selectedMethods.length === 0) {
      Alert.alert('No Payment Methods', 'Please select at least one payment method.');
      return;
    }

    setIsSaving(true);
    try {
      const paymentConfig: PaymentConfig = {
        stripePublishableKey: publishableKey.trim(),
        stripeSecretKey: secretKey.trim(),
        paymentMethods: selectedMethods,
        enabled: isEnabled,
      };

      await updatePaymentConfig(paymentConfig);
      Alert.alert('Success', 'Payment settings saved successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to save payment settings:', error);
      Alert.alert('Error', 'Failed to save payment settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setSelectedMethods(prev => {
      if (prev.includes(method)) {
        if (method === 'cash' && prev.length === 1) {
          Alert.alert('Cannot Remove', 'At least one payment method must be selected.');
          return prev;
        }
        return prev.filter(m => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  const isMethodSelected = (method: PaymentMethod) => {
    return selectedMethods.includes(method);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Settings</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Processing</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Enable Payment Processing</Text>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ false: '#e5e5e5', true: '#007AFF' }}
              thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {isEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stripe Configuration</Text>
            <Text style={styles.description}>
              Enter your Stripe API keys to enable card and digital wallet payments.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Publishable Key (pk_test_...)</Text>
              <TextInput
                style={styles.input}
                value={publishableKey}
                onChangeText={setPublishableKey}
                placeholder="pk_test_your_publishable_key"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Secret Key (sk_test_...)</Text>
              <TextInput
                style={styles.input}
                value={secretKey}
                onChangeText={setSecretKey}
                placeholder="sk_test_your_secret_key"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <Text style={styles.description}>
            Select which payment methods to accept from customers.
          </Text>

          <View style={styles.methodsContainer}>
            {paymentMethodOptions.map((method) => (
              <Pressable
                key={method.id}
                style={[
                  styles.methodCard,
                  isMethodSelected(method.id as PaymentMethod) && styles.selectedMethod
                ]}
                onPress={() => togglePaymentMethod(method.id as PaymentMethod)}>
                <View style={styles.methodContent}>
                  <Ionicons 
                    name={method.icon as any} 
                    size={24} 
                    color={isMethodSelected(method.id as PaymentMethod) ? 'white' : method.color} 
                  />
                  <Text style={[
                    styles.methodText,
                    isMethodSelected(method.id as PaymentMethod) && styles.selectedMethodText
                  ]}>
                    {method.name}
                  </Text>
                </View>
                {isMethodSelected(method.id as PaymentMethod) && (
                  <Ionicons name="checkmark-circle" size={24} color="white" />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}>
          <Text style={styles.buttonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.saveButton, isSaving && styles.disabledButton]}
          disabled={isSaving}
          onPress={handleSave}>
          <Text style={[styles.buttonText, styles.saveButtonText]}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  methodsContainer: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    backgroundColor: '#f9f9f9',
  },
  selectedMethod: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  methodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    color: '#333',
  },
  selectedMethodText: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    color: 'white',
  },
}); 