import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  ActivityIndicator,

} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;

   // NEW
  onConfirm?: () => Promise<void> | void;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
}

const { width } = Dimensions.get('window');

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  onConfirm,
  showCancel = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: CustomAlertProps) {
  const [loading, setLoading] = useState(false);
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: '#34C759' };
      case 'error':
        return { name: 'close-circle', color: '#FF3B30' };
      case 'warning':
        return { name: 'warning', color: '#FF9500' };
      default:
        return { name: 'information-circle', color: '#007AFF' };
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#E8F5E8';
      case 'error':
        return '#FFE5E5';
      case 'warning':
        return '#FFF8E5';
      default:
        return '#E5F2FF';
    }
  };

   const getConfirmColor = () => {
    if (type === 'error') return '#FF3B30'; // destructive
    if (type === 'warning') return '#FF9500';
    return '#007AFF';
  };

  const handleConfirm = async () => {
    if (!onConfirm) return;

    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
      onClose(); // ✅ Automatically close after confirm
    }
  };

  const icon = getIcon();
  const backgroundColor = getBackgroundColor();
  const confirmColor = getConfirmColor();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor }]}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon.name as any} size={48} color={icon.color} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonRow}>
            {showCancel && (
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </Pressable>
            )}

            {onConfirm ? (
              <Pressable
                style={[
                  styles.button,
                  { backgroundColor: confirmColor },
                  loading && { opacity: 0.7 },
                ]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{confirmText}</Text>
                )}
              </Pressable>
            ) : (
              <Pressable style={styles.button} onPress={onClose}>
                <Text style={styles.buttonText}>OK</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
 
  cancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
}); 