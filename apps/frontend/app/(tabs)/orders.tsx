import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
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

const formatPaymentMethod = (method: string) => {
  switch (method) {
    case 'cash': return 'Cash';
    case 'card': return 'Card';
    case 'digital_wallet': return 'Digital Wallet';
    case 'bank_transfer': return 'Bank Transfer';
    default: return method;
  }
};

const formatWalletType = (walletType?: string) => {
  switch (walletType) {
    case 'apple_pay': return 'Apple Pay';
    case 'google_pay': return 'Google Pay';
    case 'paypal': return 'PayPal';
    default: return '';
  }
};

const PaymentMethodIcon = ({ method }: { method: string }) => {
  let iconName = 'card-outline';
  let iconColor = '#007AFF';

  switch (method) {
    case 'cash':
      iconName = 'cash-outline';
      iconColor = '#34C759';
      break;
    case 'card':
      iconName = 'card-outline';
      iconColor = '#007AFF';
      break;
    case 'digital_wallet':
      iconName = 'phone-portrait-outline';
      iconColor = '#FF9500';
      break;
    case 'bank_transfer':
      iconName = 'business-outline';
      iconColor = '#5856D6';
      break;
  }

  return <Ionicons name={iconName as any} size={16} color={iconColor} />;
};

export default function OrdersScreen() {
  const { orders, formatPrice,authenticatedEmployee, } = useStore();

  // Redirect to dashboard if no employee is logged in
  if (!authenticatedEmployee) {
    console.log('No authenticated employee, redirecting to dashboard');
    return <Redirect href="/(tabs)/dashboard" />;
  }

  const renderPaymentDetails = (order: any) => {
    if (!order.paymentDetails || order.paymentDetails.length === 0) {
      return (
        <View style={styles.paymentMethodContainer}>
          <PaymentMethodIcon method={order.paymentMethod} />
          <Text style={styles.paymentMethod}>
            {formatPaymentMethod(order.paymentMethod)}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.paymentDetailsContainer}>
        {order.paymentDetails.map((payment: any, index: number) => (
          <View key={index} style={styles.paymentDetailItem}>
            <View style={styles.paymentMethodContainer}>
              <PaymentMethodIcon method={payment.method} />
              <Text style={styles.paymentMethod}>
                {formatPaymentMethod(payment.method)}: {formatPrice(payment.amount)}
              </Text>
            </View>
            
            {payment.transactionId && (
              <Text style={styles.paymentDetail}>Transaction: {payment.transactionId}</Text>
            )}
            
            {payment.cardLast4 && (
              <Text style={styles.paymentDetail}>
                Card: ****{payment.cardLast4} ({payment.cardBrand})
              </Text>
            )}
            
            {payment.walletType && (
              <Text style={styles.paymentDetail}>
                Wallet: {formatWalletType(payment.walletType)}
              </Text>
            )}
            
            {payment.change && payment.change > 0 && (
              <Text style={styles.paymentDetail}>Change: {formatPrice(payment.change)}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

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
                  item.status === 'completed' ? styles.completedBadge : 
                  item.status === 'pending' ? styles.pendingBadge : styles.refundedBadge
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
                {renderPaymentDetails(item)}
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentMethod: {
    marginLeft: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  paymentDetailsContainer: {
    marginBottom: 8,
  },
  paymentDetailItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  paymentDetail: {
    fontSize: 12,
    color: '#666',
    marginLeft: 24,
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#34C759',
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
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