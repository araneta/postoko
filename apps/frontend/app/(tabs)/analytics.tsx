import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import useStore from '../../store/useStore';
import analyticsService from '../../lib/analytics';

export default function AnalyticsScreen() {
  const { formatPrice } = useStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [report, setReport] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchAnalytics();
    fetchReport(reportPeriod);
  }, [reportPeriod]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await analyticsService.getAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      setAnalyticsError(err.message || 'Error fetching analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchReport = async (period: 'daily' | 'weekly' | 'monthly') => {
    setReportLoading(true);
    setReportError(null);
    try {
      const data = await analyticsService.getSalesReport(period);
      setReport(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setReportError(err.message || 'Error fetching sales report');
    } finally {
      setReportLoading(false);
    }
  };

  // Prepare chart data
  const chartLabels = report.map((row: any) => row.period);
  const chartData = report.map((row: any) => Number(row.totalSales));
  const screenWidth = Dimensions.get('window').width - 32; // padding

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {/* Analytics Dashboard */}
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Sales Analytics</Text>
        {analyticsLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : analyticsError ? (
          <Text style={{ color: 'red' }}>{analyticsError}</Text>
        ) : analytics ? (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Total Sales: <Text style={{ color: '#007AFF' }}>{formatPrice(Number(analytics.totalSales))}</Text></Text>
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Order Count: <Text style={{ color: '#007AFF' }}>{analytics.orderCount}</Text></Text>
            <Text style={{ fontSize: 16, fontWeight: '500', marginTop: 8 }}>Top Products:</Text>
            {analytics.topProducts && analytics.topProducts.length > 0 ? (
              analytics.topProducts.map((prod: any, idx: number) => (
                <Text key={prod.productId} style={{ marginLeft: 8 }}>{idx + 1}. {prod.productId} (Sold: {prod.quantitySold})</Text>
              ))
            ) : (
              <Text style={{ marginLeft: 8 }}>No data</Text>
            )}
          </View>
        ) : null}
      </View>
      {/* Sales Chart */}
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Sales Chart</Text>
        {reportLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : reportError ? (
          <Text style={{ color: 'red' }}>{reportError}</Text>
        ) : report && report.length > 0 ? (
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                {
                  data: chartData,
                },
              ],
            }}
            width={screenWidth}
            height={220}
            yAxisLabel={''}
            yAxisSuffix={''}
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#007AFF',
              },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        ) : (
          <Text>No sales data</Text>
        )}
      </View>
      {/* Sales Report */}
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', flex: 1 }}>Sales Report</Text>
          <Pressable onPress={() => setReportPeriod('daily')} style={{ marginHorizontal: 4, padding: 4, backgroundColor: reportPeriod === 'daily' ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: reportPeriod === 'daily' ? 'white' : '#007AFF' }}>Daily</Text></Pressable>
          <Pressable onPress={() => setReportPeriod('weekly')} style={{ marginHorizontal: 4, padding: 4, backgroundColor: reportPeriod === 'weekly' ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: reportPeriod === 'weekly' ? 'white' : '#007AFF' }}>Weekly</Text></Pressable>
          <Pressable onPress={() => setReportPeriod('monthly')} style={{ marginHorizontal: 4, padding: 4, backgroundColor: reportPeriod === 'monthly' ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: reportPeriod === 'monthly' ? 'white' : '#007AFF' }}>Monthly</Text></Pressable>
        </View>
        {reportLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : reportError ? (
          <Text style={{ color: 'red' }}>{reportError}</Text>
        ) : report && report.length > 0 ? (
          <View>
            {report.map((row, idx) => (
              <View key={row.period} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={{ flex: 1 }}>{row.period}</Text>
                <Text style={{ flex: 1, textAlign: 'right' }}>{formatPrice(Number(row.totalSales))}</Text>
                <Text style={{ flex: 1, textAlign: 'right' }}>{row.orderCount} orders</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text>No sales data</Text>
        )}
      </View>
    </ScrollView>
  );
} 