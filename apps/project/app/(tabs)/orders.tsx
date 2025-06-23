import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import useStore from '../../store/useStore';

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

export default function OrdersScreen() {
  const { orders,formatPrice } = useStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order History</Text>
      <FlatList
        data={orders}
        renderItem={({ item }) => {
          const { date, time } = formatDateTime(item.date);
          return (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{item.id}</Text>
                  <View style={styles.dateTimeContainer}>
                    <Text style={styles.dateText}>{date}</Text>
                    <Text style={styles.timeText}>{time}</Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  item.status === 'completed' ? styles.completedBadge : styles.refundedBadge
                ]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.orderItems}>
                {item.items.map((orderItem) => (
                  <View key={orderItem.id} style={styles.orderItem}>
                    <Text style={styles.itemName}>{orderItem.name}</Text>
                    <Text style={styles.itemQuantity}>x{orderItem.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      {formatPrice(orderItem.price * orderItem.quantity)}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.paymentMethod}>
                  Paid with {item.paymentMethod}
                </Text>
                <Text style={styles.orderTotal}>
                  Total: {formatPrice(item.total)}
                </Text>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#666',
    fontSize: 14,
    marginRight: 8,
  },
  timeText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
  },
  itemQuantity: {
    marginHorizontal: 16,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  paymentMethod: {
    color: '#666',
    fontStyle: 'italic',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  refundedBadge: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});