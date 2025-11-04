import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable, ScrollView, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Redirect, useRouter } from 'expo-router';
import useStore from '../../store/useStore';
import analyticsService from '../../lib/analytics';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { formatPrice, authenticatedEmployee } = useStore();

  const [analytics, setAnalytics] = useState<any>(null);
  const [report, setReport] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [profitMargin, setProfitMargin] = useState<any>(null);

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(true);
  const [bestSellersLoading, setBestSellersLoading] = useState(true);
  const [peakHoursLoading, setPeakHoursLoading] = useState(true);
  const [profitMarginLoading, setProfitMarginLoading] = useState(true);

  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [bestSellersError, setBestSellersError] = useState<string | null>(null);
  const [peakHoursError, setPeakHoursError] = useState<string | null>(null);
  const [profitMarginError, setProfitMarginError] = useState<string | null>(null);

  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [bestSellersPeriod, setBestSellersPeriod] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [profitMarginPeriod, setProfitMarginPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [peakHoursDays, setPeakHoursDays] = useState<number>(30);

  // Redirect to dashboard if no employee is logged in
  if (!authenticatedEmployee) {
    console.log('No authenticated employee, redirecting to dashboard');
    return <Redirect href="/(tabs)/dashboard" />;
    router.replace('/(tabs)/dashboard');
    return null;
  }
 

  useEffect(() => {
    fetchAllData();
  }, [reportPeriod, bestSellersPeriod, profitMarginPeriod, peakHoursDays]);

  const fetchAllData = async () => {
    fetchAnalytics();
    fetchReport(reportPeriod);
    fetchBestSellers(bestSellersPeriod);
    fetchPeakHours(peakHoursDays);
    fetchProfitMargin(profitMarginPeriod);
  };

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

  const fetchBestSellers = async (period: 'all' | 'week' | 'month' | 'year') => {
    setBestSellersLoading(true);
    setBestSellersError(null);
    try {
      const data = await analyticsService.getBestSellers(10, period);
      setBestSellers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setBestSellersError(err.message || 'Error fetching best sellers');
    } finally {
      setBestSellersLoading(false);
    }
  };

  const fetchPeakHours = async (days: number) => {
    setPeakHoursLoading(true);
    setPeakHoursError(null);
    try {
      const data = await analyticsService.getPeakHours(days);
      setPeakHours(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPeakHoursError(err.message || 'Error fetching peak hours');
    } finally {
      setPeakHoursLoading(false);
    }
  };

  const fetchProfitMargin = async (period: 'week' | 'month' | 'year') => {
    setProfitMarginLoading(true);
    setProfitMarginError(null);
    try {
      const data = await analyticsService.getProfitMargin(period);
      setProfitMargin(data);
    } catch (err: any) {
      setProfitMarginError(err.message || 'Error fetching profit margin');
    } finally {
      setProfitMarginLoading(false);
    }
  };

  // Prepare chart data
  const chartLabels = report.map((row: any) => row.period);
  const chartData = report.map((row: any) => Number(row.totalSales));
  const screenWidth = Dimensions.get('window').width - 32; // padding

  // Prepare peak hours chart data
  const peakHoursLabels = peakHours.map((hour: any) => `${hour.hour}:00`);
  const peakHoursData = peakHours.map((hour: any) => Number(hour.orderCount));

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

      {/* Profit Margin Section */}
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', flex: 1 }}>Profit Margin</Text>
          <Pressable onPress={() => setProfitMarginPeriod('week')} style={{ marginHorizontal: 4, padding: 4, backgroundColor: profitMarginPeriod === 'week' ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: profitMarginPeriod === 'week' ? 'white' : '#007AFF' }}>Week</Text></Pressable>
          <Pressable onPress={() => setProfitMarginPeriod('month')} style={{ marginHorizontal: 4, padding: 4, backgroundColor: profitMarginPeriod === 'month' ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: profitMarginPeriod === 'month' ? 'white' : '#007AFF' }}>Month</Text></Pressable>
          <Pressable onPress={() => setProfitMarginPeriod('year')} style={{ marginHorizontal: 4, padding: 4, backgroundColor: profitMarginPeriod === 'year' ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: profitMarginPeriod === 'year' ? 'white' : '#007AFF' }}>Year</Text></Pressable>
        </View>
        {profitMarginLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : profitMarginError ? (
          <Text style={{ color: 'red' }}>{profitMarginError}</Text>
        ) : profitMargin ? (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Total Revenue:</Text>
              <Text style={{ fontSize: 16, color: '#007AFF' }}>{formatPrice(Number(profitMargin.totalRevenue))}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Total Cost:</Text>
              <Text style={{ fontSize: 16, color: '#FF3B30' }}>{formatPrice(Number(profitMargin.totalCost))}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Total Profit:</Text>
              <Text style={{ fontSize: 16, color: '#34C759' }}>{formatPrice(Number(profitMargin.totalProfit))}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Profit Margin:</Text>
              <Text style={{ fontSize: 16, color: profitMargin.profitMargin >= 0 ? '#34C759' : '#FF3B30' }}>{profitMargin.profitMargin}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Orders:</Text>
              <Text style={{ fontSize: 16 }}>{profitMargin.orderCount}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>Avg Order Value:</Text>
              <Text style={{ fontSize: 16 }}>{formatPrice(Number(profitMargin.averageOrderValue))}</Text>
            </View>
          </View>
        ) : (
          <Text>No profit margin data</Text>
        )}
      </View>

      {/* Best Sellers Section */}
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', flex: 1 }}>Best Sellers</Text>
          <Pressable onPress={() => setBestSellersPeriod('all')} style={{ marginHorizontal: 4, padding: 4, backgroundColor: bestSellersPeriod === 'all' ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: bestSellersPeriod === 'all' ? 'white' : '#007AFF' }}>All</Text></Pressable>
          <Pressable onPress={() => setBestSellersPeriod('week')} style={{ marginHorizontal: 4, padding: 4, backgroundColor: bestSellersPeriod === 'week' ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: bestSellersPeriod === 'week' ? 'white' : '#007AFF' }}>Week</Text></Pressable>
          <Pressable onPress={() => setBestSellersPeriod('month')} style={{ marginHorizontal: 4, padding: 4, backgroundColor: bestSellersPeriod === 'month' ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: bestSellersPeriod === 'month' ? 'white' : '#007AFF' }}>Month</Text></Pressable>
          <Pressable onPress={() => setBestSellersPeriod('year')} style={{ marginHorizontal: 4, padding: 4, backgroundColor: bestSellersPeriod === 'year' ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: bestSellersPeriod === 'year' ? 'white' : '#007AFF' }}>Year</Text></Pressable>
        </View>
        {bestSellersLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : bestSellersError ? (
          <Text style={{ color: 'red' }}>{bestSellersError}</Text>
        ) : bestSellers && bestSellers.length > 0 ? (
          <View>
            {bestSellers.map((product: any, idx: number) => (
              <View key={product.productId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600' }}>{idx + 1}. {product.productName}</Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>Qty: {product.totalQuantity}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#007AFF' }}>{formatPrice(Number(product.totalRevenue))}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Avg: {formatPrice(Number(product.averagePrice))}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text>No best sellers data</Text>
        )}
      </View>

      {/* Peak Hours Section */}
      <View style={{ padding: 16, backgroundColor: 'white', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', flex: 1 }}>Peak Hours</Text>
          <Pressable onPress={() => setPeakHoursDays(7)} style={{ marginHorizontal: 4, padding: 4, backgroundColor: peakHoursDays === 7 ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: peakHoursDays === 7 ? 'white' : '#007AFF' }}>7d</Text></Pressable>
          <Pressable onPress={() => setPeakHoursDays(30)} style={{ marginHorizontal: 4, padding: 4, backgroundColor: peakHoursDays === 30 ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: peakHoursDays === 30 ? 'white' : '#007AFF' }}>30d</Text></Pressable>
          <Pressable onPress={() => setPeakHoursDays(90)} style={{ marginHorizontal: 4, padding: 4, backgroundColor: peakHoursDays === 90 ? '#007AFF' : '#eee', borderRadius: 4 }}><Text style={{ color: peakHoursDays === 90 ? 'white' : '#007AFF' }}>90d</Text></Pressable>
        </View>
        {peakHoursLoading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : peakHoursError ? (
          <Text style={{ color: 'red' }}>{peakHoursError}</Text>
        ) : peakHours && peakHours.length > 0 ? (
          <View>
            <BarChart
              data={{
                labels: peakHoursLabels,
                datasets: [
                  {
                    data: peakHoursData,
                  },
                ],
              }}
              width={screenWidth}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                style: { borderRadius: 16 },
                barPercentage: 0.7,
              }}
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
            <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 }}>Orders per hour (last {peakHoursDays} days)</Text>
          </View>
        ) : (
          <Text>No peak hours data</Text>
        )}
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