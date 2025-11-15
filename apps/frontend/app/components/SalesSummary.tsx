import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EmployeeSales } from '../../types';
import { Ionicons } from '@expo/vector-icons';

interface SalesSummaryProps {
  data: EmployeeSales[];
  period: string;
}

const SalesSummary: React.FC<SalesSummaryProps> = ({ data, period }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const totalSales = data.reduce((sum, emp) => sum + parseFloat(emp.totalSales), 0);
  const totalOrders = data.reduce((sum, emp) => sum + emp.orderCount, 0);
  const totalProfit = data.reduce((sum, emp) => sum + parseFloat(emp.totalProfit), 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const summaryItems = [
    {
      icon: 'cash-outline',
      label: 'Total Sales',
      value: formatCurrency(totalSales),
      color: '#007AFF',
    },
    {
      icon: 'receipt-outline',
      label: 'Total Orders',
      value: totalOrders.toString(),
      color: '#28a745',
    },
    {
      icon: 'trending-up-outline',
      label: 'Avg Order',
      value: formatCurrency(avgOrderValue),
      color: '#ffc107',
    },
    {
      icon: 'analytics-outline',
      label: 'Profit Margin',
      value: `${profitMargin.toFixed(1)}%`,
      color: '#6f42c1',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Summary ({period})</Text>
      <View style={styles.grid}>
        {summaryItems.map((item, index) => (
          <View key={index} style={styles.summaryItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={[styles.value, { color: item.color }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SalesSummary;