import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getOrders } from '../../lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { Image } from 'react-native';
import { images } from '@/constants';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ReportsScreen() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState<any>(null);

    const isAdmin = user?.email === 'curtissilaadmin@gmail.com';

    const generateReport = async () => {
        setLoading(true);
        try {
            const orders = await getOrders({
                month: selectedMonth,
                year: selectedYear
            });

            const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const pendingOrders = orders.filter(o => o.status === 'pending').length;
            const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
            const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

            setReportData({
                orders,
                totalRevenue,
                pendingOrders,
                confirmedOrders,
                deliveredOrders,
                totalOrders: orders.length
            });

        } catch (error) {
            Alert.alert('Error', 'Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        if (!reportData) return;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Monthly Sales Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    h1 { color: #FE8C00; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .summary { background: #f5f5f5; padding: 15px; border-radius: 10px; margin-bottom: 30px; }
                    .summary-grid { display: flex; gap: 15px; margin-bottom: 30px; }
                    .summary-card { background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #FE8C00; color: white; }
                    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 50px; color: #999; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 Fast Food App - Monthly Sales Report</h1>
                    <p>${monthNames[selectedMonth - 1]} ${selectedYear}</p>
                </div>
                
                <div class="summary">
                    <h3>Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <p><strong>Total Orders</strong></p>
                            <h2>${reportData.totalOrders}</h2>
                        </div>
                        <div class="summary-card">
                            <p><strong>Total Revenue</strong></p>
                            <h2 style="color: green;">Ksh ${reportData.totalRevenue.toFixed(2)}</h2>
                        </div>
                    </div>
                    <div class="summary-grid">
                        <div class="summary-card">
                            <p>📦 Pending</p>
                            <h3>${reportData.pendingOrders}</h3>
                        </div>
                        <div class="summary-card">
                            <p>✅ Confirmed</p>
                            <h3>${reportData.confirmedOrders}</h3>
                        </div>
                        <div class="summary-card">
                            <p>🚚 Delivered</p>
                            <h3>${reportData.deliveredOrders}</h3>
                        </div>
                    </div>
                </div>
                
                <h3>Order Details</h3>
                <table>
                    <thead>
                        <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${reportData.orders.map(order => `
                            <tr>
                                <td>${order.$id.slice(-8)}</td>
                                <td>${order.userName}</td>
                                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                                <td>${JSON.parse(order.items).length}</td>
                                <td>Ksh ${order.totalAmount.toFixed(2)}</td>
                                <td>${order.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    <h3>Grand Total: Ksh ${reportData.totalRevenue.toFixed(2)}</h3>
                </div>
                
                <div class="footer">
                    <p>Generated on ${new Date().toLocaleString()}</p>
                    <p>Fast Food App Admin System</p>
                </div>
            </body>
            </html>
        `;

        try {
            const fileUri = FileSystem.documentDirectory + `sales_report_${selectedMonth}_${selectedYear}.html`;
            await FileSystem.writeAsStringAsync(fileUri, htmlContent);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Error', 'Sharing not available');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to generate report file');
        }
    };

    const shareAsText = async () => {
        if (!reportData) return;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        let message = `📊 SALES REPORT - ${monthNames[selectedMonth - 1]} ${selectedYear}\n`;
        message += `================================\n\n`;
        message += `📦 Total Orders: ${reportData.totalOrders}\n`;
        message += `💰 Total Revenue: Ksh ${reportData.totalRevenue.toFixed(2)}\n`;
        message += `⏳ Pending: ${reportData.pendingOrders}\n`;
        message += `✅ Confirmed: ${reportData.confirmedOrders}\n`;
        message += `🚚 Delivered: ${reportData.deliveredOrders}\n\n`;
        message += `================================\n`;
        message += `Generated on: ${new Date().toLocaleString()}\n`;

        await Share.share({ message });
    };

    if (!isAdmin) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Text className="text-red-500 text-lg font-bold">Access Denied</Text>
                <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl mt-5" onPress={() => router.back()}>
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center px-5 py-4 border-b border-gray-200 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Image source={images.arrowBack} className="w-5 h-5" style={{ tintColor: '#333' }} />
                </TouchableOpacity>
                <Text className="text-xl font-quicksand-bold text-dark-100">Sales Reports</Text>
            </View>

            <ScrollView className="flex-1 p-5">
                {/* Filter Section */}
                <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm">
                    <Text className="font-quicksand-bold text-dark-100 mb-4">Select Period</Text>

                    {/* Month Selection */}
                    <Text className="text-sm text-gray-500 mb-2">Month</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        {MONTHS.map((month, index) => (
                            <TouchableOpacity
                                key={index}
                                className={`px-4 py-2 rounded-full mr-2 ${selectedMonth === index + 1 ? 'bg-primary' : 'bg-gray-200'}`}
                                onPress={() => setSelectedMonth(index + 1)}
                            >
                                <Text className={selectedMonth === index + 1 ? 'text-white' : 'text-gray-700'}>
                                    {month.slice(0, 3)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Year Selection */}
                    <Text className="text-sm text-gray-500 mb-2">Year</Text>
                    <View className="flex-row gap-3 mb-5">
                        {[2024, 2025].map(year => (
                            <TouchableOpacity
                                key={year}
                                className={`flex-1 py-3 rounded-xl ${selectedYear === year ? 'bg-primary' : 'bg-gray-200'}`}
                                onPress={() => setSelectedYear(year)}
                            >
                                <Text className={`text-center font-bold ${selectedYear === year ? 'text-white' : 'text-gray-700'}`}>
                                    {year}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Generate Button */}
                    <TouchableOpacity
                        className="bg-primary py-3 rounded-xl"
                        onPress={generateReport}
                        disabled={loading}
                    >
                        <Text className="text-white text-center font-quicksand-bold">
                            {loading ? 'Generating...' : 'Generate Report'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Report Results */}
                {reportData && (
                    <View className="bg-white rounded-2xl p-5 shadow-sm">
                        <Text className="font-quicksand-bold text-dark-100 text-lg mb-4">Report Summary</Text>

                        {/* Stats Cards */}
                        <View className="flex-row gap-3 mb-5">
                            <View className="flex-1 bg-primary/10 rounded-xl p-3">
                                <Text className="text-gray-500 text-sm">Total Orders</Text>
                                <Text className="text-2xl font-bold text-primary">{reportData.totalOrders}</Text>
                            </View>
                            <View className="flex-1 bg-green-50 rounded-xl p-3">
                                <Text className="text-gray-500 text-sm">Revenue</Text>
                                <Text className="text-2xl font-bold text-green-600">Ksh {reportData.totalRevenue.toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* Status Breakdown */}
                        <View className="flex-row gap-3 mb-5">
                            <View className="flex-1 bg-yellow-50 rounded-xl p-3">
                                <Text className="text-gray-500 text-sm">Pending</Text>
                                <Text className="text-xl font-bold text-yellow-600">{reportData.pendingOrders}</Text>
                            </View>
                            <View className="flex-1 bg-blue-50 rounded-xl p-3">
                                <Text className="text-gray-500 text-sm">Confirmed</Text>
                                <Text className="text-xl font-bold text-blue-600">{reportData.confirmedOrders}</Text>
                            </View>
                            <View className="flex-1 bg-green-50 rounded-xl p-3">
                                <Text className="text-gray-500 text-sm">Delivered</Text>
                                <Text className="text-xl font-bold text-green-600">{reportData.deliveredOrders}</Text>
                            </View>
                        </View>

                        {/* Export Buttons */}
                        <View className="gap-3">
                            <TouchableOpacity
                                className="bg-blue-500 py-3 rounded-xl flex-row justify-center items-center"
                                onPress={downloadPDF}
                            >
                                <Text className="text-white text-center font-quicksand-bold ml-2">📄 Download Report</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="bg-green-500 py-3 rounded-xl flex-row justify-center items-center"
                                onPress={shareAsText}
                            >
                                <Text className="text-white text-center font-quicksand-bold ml-2">📤 Share Report</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];