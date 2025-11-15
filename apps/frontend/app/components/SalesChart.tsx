import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { EmployeeSales } from '../../types';

interface SalesChartProps {
  data: EmployeeSales[];
  type: 'sales' | 'orders' | 'profit';
}

const { width } = Dimensions.get('window');
const chartWidth = width - 32;

const SalesChart: React.FC<SalesChartProps> = ({ data, type }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  const getValue = (item: EmployeeSales) => {
    switch (type) {
      case 'sales':
        return parseFloat(item.totalSales);
      case 'orders':
        return item.orderCount;
      case 'profit':
        return parseFloat(item.totalProfit);
      default:
        return 0;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'sales':
        return 'Total Sales';
      case 'orders':
        return 'Order Count';
      case 'profit':
        return 'Total Profit';
      default:
        return '';
    }
  };

  const formatValue = (value: number) => {
    if (type === 'orders') {
      return value.toString();
    }
    return `$${value.toFixed(2)}`;
  };

  const maxValue = Math.max(...data.map(getValue));
  const sortedData = [...data].sort((a, b) => getValue(b) - getValue(a)).slice(0, 5);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getLabel()}</Text>
      <View style={styles.chart}>
        {sortedData.map((item, index) => {
          const value = getValue(item);
          const barWidth = (value / maxValue) * (chartWidth - 120);
          
          return (
            <View key={item.employeeId} style={styles.barContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.employeeName} numberOfLines={1}>
                  {item.employeeName}
                </Text>
                <Text style={styles.employeeRole}>{item.employeeRole}</Text>
              </View>
              <View style={styles.barWrapper}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      width: Math.max(barWidth, 20),
                      backgroundColor: `hsl(${210 + index * 30}, 70%, ${60 - index * 5}%)`,
                    }
                  ]} 
                />
                <Text style={styles.valueText}>{formatValue(value)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
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
  chart: {
    gap: 12,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  labelContainer: {
    width: 100,
    marginRight: 12,
  },
  employeeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  employeeRole: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  barWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  valueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    minWidth: 60,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
});

export default SalesChart;