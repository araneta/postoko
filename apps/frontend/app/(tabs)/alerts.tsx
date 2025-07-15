import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../../store/useStore';
import { StockAlert } from '../../types';

export default function AlertsScreen() {
  const { 
    stockAlerts, 
    getStockAlerts, 
    markAlertAsRead, 
    markAllAlertsAsRead, 
    getUnreadAlertCount,
    checkLowStockAlerts 
  } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check for low stock alerts when component mounts
    checkLowStockAlerts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await checkLowStockAlerts();
    } catch (error) {
      console.error('Failed to refresh alerts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = (alertId: string) => {
    markAlertAsRead(alertId);
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all alerts as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All Read', onPress: markAllAlertsAsRead },
      ]
    );
  };

  const handleAlertPress = (alert: StockAlert) => {
    if (!alert.isRead) {
      handleMarkAsRead(alert.id);
    }
  };

  const renderAlert = ({ item }: { item: StockAlert }) => (
    <Pressable
      style={[styles.alertItem, !item.isRead && styles.unreadAlert]}
      onPress={() => handleAlertPress(item)}>
      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <Text style={styles.productName}>{item.productName}</Text>
          {!item.isRead && <View style={styles.unreadBadge} />}
        </View>
        <Text style={styles.alertMessage}>
          Current stock: {item.currentStock} (Threshold: {item.threshold})
        </Text>
        <Text style={styles.alertDate}>
          {new Date(item.createdAt).toLocaleDateString()} at{' '}
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
      <Ionicons 
        name={item.isRead ? "checkmark-circle" : "alert-circle"} 
        size={24} 
        color={item.isRead ? "#4CAF50" : "#FF9800"} 
      />
    </Pressable>
  );

  const unreadCount = getUnreadAlertCount();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stock Alerts</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
        {stockAlerts.length > 0 && (
          <Pressable style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Mark All Read</Text>
          </Pressable>
        )}
      </View>

      {stockAlerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
          <Text style={styles.emptyTitle}>No Stock Alerts</Text>
          <Text style={styles.emptyMessage}>
            All products are well stocked! You'll receive notifications when any product runs low on stock.
          </Text>
          <Pressable style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={stockAlerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
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
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  markAllText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: {
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  alertItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertContent: {
    flex: 1,
    marginRight: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  alertDate: {
    fontSize: 12,
    color: '#999',
  },
}); 