import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView, Alert } from 'react-native';
import { Redirect, router } from 'expo-router';
import { getEmployeesSales, getEmployeesPerformance, getEmployeeSalesDetail } from '../../lib/api';
import { EmployeeSales, EmployeePerformance, EmployeeSalesDetail } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../../store/useStore';
import SalesChart from '../components/SalesChart';
import SalesSummary from '../components/SalesSummary';

type PeriodType = 'week' | 'month' | 'year';

const EmployeeSalesScreen = () => {
    const { authenticatedEmployee } = useStore();
    const [salesData, setSalesData] = useState<EmployeeSales[]>([]);
    const [performanceData, setPerformanceData] = useState<EmployeePerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
    const [viewMode, setViewMode] = useState<'sales' | 'performance'>('sales');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSales | null>(null);
    const [employeeDetails, setEmployeeDetails] = useState<{ employee: EmployeeSales; sales: EmployeeSalesDetail[] } | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showCharts, setShowCharts] = useState(false);

    useEffect(() => {
        if (authenticatedEmployee) {
            fetchData();
        }
    }, [authenticatedEmployee, selectedPeriod, viewMode]);

    // Redirect to dashboard if no employee is logged in
    if (!authenticatedEmployee) {
        return <Redirect href="/(tabs)/dashboard" />;
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            if (viewMode === 'sales') {
                const data = await getEmployeesSales(selectedPeriod);
                setSalesData(Array.isArray(data) ? data : []);
            } else {
                const data = await getEmployeesPerformance(selectedPeriod);
                setPerformanceData(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Failed to fetch employee sales data', error);
            setSalesData([]);
            setPerformanceData([]);
            Alert.alert('Error', 'Failed to load sales data. Please check your connection and try again.');
        }
        setLoading(false);
    };

    const fetchEmployeeDetails = async (employee: EmployeeSales) => {
        setDetailLoading(true);
        try {
            const details = await getEmployeeSalesDetail(employee.employeeId, selectedPeriod);
            setEmployeeDetails(details);
        } catch (error) {
            console.error('Failed to fetch employee details', error);
            setEmployeeDetails(null);
            Alert.alert('Error', 'Failed to load employee details. Please try again.');
        }
        setDetailLoading(false);
    };

    const handleEmployeePress = async (employee: EmployeeSales) => {
        setSelectedEmployee(employee);
        setShowDetailModal(true);
        await fetchEmployeeDetails(employee);
    };

    const formatCurrency = (amount: string | number | null) => {
        if (amount === null || amount === undefined) {
            return '$0.00';
        }
        return `$${parseFloat(amount.toString()).toFixed(2)}`;
    };

    const renderSalesItem = ({ item }: { item: EmployeeSales }) => (
        <TouchableOpacity style={styles.item} onPress={() => handleEmployeePress(item)}>
            <View style={styles.itemHeader}>
                <Ionicons name="person-circle" size={40} color="#007AFF" />
                <View style={styles.itemInfo}>
                    <Text style={styles.employeeName}>{item.employeeName}</Text>
                    <Text style={styles.employeeRole}>{item.employeeRole}</Text>
                </View>
                <View style={styles.itemStats}>
                    <Text style={styles.totalSales}>{formatCurrency(item.totalSales)}</Text>
                    <Text style={styles.orderCount}>{item.orderCount} orders</Text>
                </View>
            </View>
            <View style={styles.itemDetails}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Avg Order</Text>
                    <Text style={styles.statValue}>{formatCurrency(item.averageOrderValue)}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Profit</Text>
                    <Text style={styles.statValue}>{formatCurrency(item.totalProfit)}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Margin</Text>
                    <Text style={styles.statValue}>{item.profitMargin ? item.profitMargin.toFixed(1) : '0.0'}%</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderPerformanceItem = ({ item, index }: { item: EmployeePerformance; index: number }) => (
        <TouchableOpacity style={styles.item} onPress={() => handleEmployeePress(item as EmployeeSales)}>
            <View style={styles.itemHeader}>
                <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.employeeName}>{item.employeeName}</Text>
                    <Text style={styles.employeeRole}>{item.employeeRole}</Text>
                </View>
                <View style={styles.itemStats}>
                    <Text style={styles.totalSales}>{formatCurrency(item.totalSales)}</Text>
                    <Text style={styles.orderCount}>{item.orderCount} orders</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderDetailSale = ({ item }: { item: EmployeeSalesDetail }) => (
        <View style={styles.detailItem}>
            <View style={styles.detailHeader}>
                <Text style={styles.detailDate}>{new Date(item.date).toLocaleDateString()}</Text>
                <Text style={styles.detailTotal}>{formatCurrency(item.total)}</Text>
            </View>
            <Text style={styles.detailOrderId}>Order: {item.orderId}</Text>
            <Text style={styles.detailProfit}>Profit: {formatCurrency(item.profit)}</Text>
            <Text style={styles.detailItems}>{item.items ? item.items.length : 0} items</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Employee Sales</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity
                        style={styles.chartButton}
                        onPress={() => setShowCharts(!showCharts)}
                    >
                        <Ionicons name={showCharts ? "list" : "bar-chart"} size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.chartButton}
                        onPress={fetchData}
                        disabled={loading}
                    >
                        <Ionicons name="refresh" size={20} color={loading ? "#ccc" : "#007AFF"} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="close" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Period and View Mode Selector */}
            <View style={styles.controls}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodSelector}>
                    {(['week', 'month', 'year'] as PeriodType[]).map(period => (
                        <TouchableOpacity
                            key={period}
                            style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
                            onPress={() => setSelectedPeriod(period)}
                        >
                            <Text style={[styles.periodButtonText, selectedPeriod === period && styles.periodButtonTextActive]}>
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.viewModeSelector}>
                    <TouchableOpacity
                        style={[styles.viewModeButton, viewMode === 'sales' && styles.viewModeButtonActive]}
                        onPress={() => setViewMode('sales')}
                    >
                        <Text style={[styles.viewModeButtonText, viewMode === 'sales' && styles.viewModeButtonTextActive]}>
                            Sales
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewModeButton, viewMode === 'performance' && styles.viewModeButtonActive]}
                        onPress={() => setViewMode('performance')}
                    >
                        <Text style={[styles.viewModeButtonText, viewMode === 'performance' && styles.viewModeButtonTextActive]}>
                            Performance
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
            ) : showCharts && viewMode === 'sales' ? (
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                    <SalesSummary data={salesData} period={selectedPeriod} />
                    <SalesChart data={salesData} type="sales" />
                    <SalesChart data={salesData} type="orders" />
                    <SalesChart data={salesData} type="profit" />
                </ScrollView>
            ) : (
                <>
                    {viewMode === 'sales' && salesData.length > 0 && <SalesSummary data={salesData} period={selectedPeriod} />}
                    {(viewMode === 'sales' ? salesData : performanceData).length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="analytics-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyStateTitle}>No Sales Data</Text>
                            <Text style={styles.emptyStateText}>
                                No sales data available for the selected period. Sales data will appear here once employees start making sales.
                            </Text>
                            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        viewMode === 'sales' ? (
                            <FlatList
                                data={salesData}
                                keyExtractor={item => item.employeeId}
                                renderItem={renderSalesItem}
                                contentContainerStyle={{ paddingBottom: 100 }}
                                showsVerticalScrollIndicator={false}
                            />
                        ) : (
                            <FlatList
                                data={performanceData}
                                keyExtractor={item => item.employeeId}
                                renderItem={renderPerformanceItem}
                                contentContainerStyle={{ paddingBottom: 100 }}
                                showsVerticalScrollIndicator={false}
                            />
                        )
                    )}
                </>
            )}

            {/* Employee Detail Modal */}
            <Modal visible={showDetailModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedEmployee?.employeeName} - Sales Details
                            </Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <Ionicons name="close" size={24} color="#007AFF" />
                            </TouchableOpacity>
                        </View>

                        {detailLoading ? (
                            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
                        ) : employeeDetails ? (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryTitle}>Summary ({selectedPeriod})</Text>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Total Sales:</Text>
                                        <Text style={styles.summaryValue}>{formatCurrency(employeeDetails.employee.totalSales)}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Orders:</Text>
                                        <Text style={styles.summaryValue}>{employeeDetails.employee.orderCount}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Avg Order:</Text>
                                        <Text style={styles.summaryValue}>{formatCurrency(employeeDetails.employee.averageOrderValue)}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Total Profit:</Text>
                                        <Text style={styles.summaryValue}>{formatCurrency(employeeDetails.employee.totalProfit)}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Profit Margin:</Text>
                                        <Text style={styles.summaryValue}>{employeeDetails.employee.profitMargin ? employeeDetails.employee.profitMargin.toFixed(1) : '0.0'}%</Text>
                                    </View>
                                </View>

                                <Text style={styles.detailsTitle}>Recent Sales</Text>
                                <FlatList
                                    data={employeeDetails.sales}
                                    keyExtractor={item => item.orderId}
                                    renderItem={renderDetailSale}
                                    scrollEnabled={false}
                                />
                            </ScrollView>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chartButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f0f8ff',
    },
    controls: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    periodSelector: {
        marginBottom: 12,
    },
    periodButton: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    periodButtonActive: {
        backgroundColor: '#007AFF',
    },
    periodButtonText: {
        color: '#333',
        fontWeight: '500',
    },
    periodButtonTextActive: {
        color: 'white',
    },
    viewModeSelector: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 2,
    },
    viewModeButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    viewModeButtonActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    viewModeButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    viewModeButtonTextActive: {
        color: '#007AFF',
    },
    item: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    employeeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    employeeRole: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    itemStats: {
        alignItems: 'flex-end',
    },
    totalSales: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    orderCount: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    rankBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
    },
    modalBody: {
        padding: 20,
    },
    summaryCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    detailItem: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    detailDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    detailTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    detailOrderId: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    detailProfit: {
        fontSize: 12,
        color: '#28a745',
        marginBottom: 2,
    },
    detailItems: {
        fontSize: 12,
        color: '#666',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 60,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default EmployeeSalesScreen;