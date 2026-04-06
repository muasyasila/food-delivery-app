import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Alert, RefreshControl, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { getOrders, updateOrderStatus } from '../../lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { images } from '@/constants';

type OrderItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    customizations?: Array<{ id: string; name: string; price: number; type: string }>;
};

type Order = {
    $id: string;
    userName: string;
    userEmail: string;
    totalAmount: number;
    status: 'pending' | 'confirmed' | 'delivered';
    orderDate: string;
    items: string;
    deliveryAddress: string;
    userId: string;
};

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AdminOrdersScreen() {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const isAdmin = user?.email === 'curtissilaadmin@gmail.com';

    const fetchOrders = async () => {
        try {
            const filters: any = {};
            if (selectedStatus !== 'all') filters.status = selectedStatus;

            const fetchedOrders = await getOrders({
                month: selectedMonth,
                year: selectedYear,
                ...filters
            });
            setOrders(fetchedOrders as Order[]);
        } catch (error) {
            console.error('Error fetching orders:', error);
            Alert.alert('Error', 'Failed to fetch orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchOrders();
        }
    }, [selectedMonth, selectedYear, selectedStatus]);

    useFocusEffect(
        useCallback(() => {
            if (isAdmin) {
                fetchOrders();
            }
        }, [isAdmin, selectedMonth, selectedYear, selectedStatus])
    );

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            Alert.alert('Success', `Order ${newStatus === 'confirmed' ? 'confirmed' : 'marked as delivered'}`);
            fetchOrders();
            setModalVisible(false);
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('Error', 'Failed to update order status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500';
            case 'confirmed': return 'bg-blue-500';
            case 'delivered': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getTotalRevenue = () => {
        return orders.reduce((sum, order) => sum + order.totalAmount, 0);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getOrderItems = (itemsString: string): OrderItem[] => {
        try {
            return JSON.parse(itemsString);
        } catch {
            return [];
        }
    };

    const getTotalItemQuantity = (itemsString: string) => {
        const items = getOrderItems(itemsString);
        return items.reduce((sum, item) => sum + item.quantity, 0);
    };

    const viewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    // Quick filter presets
    const setThisMonth = () => {
        const now = new Date();
        setSelectedMonth(now.getMonth() + 1);
        setSelectedYear(now.getFullYear());
    };

    const setLastMonth = () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        setSelectedMonth(lastMonth.getMonth() + 1);
        setSelectedYear(lastMonth.getFullYear());
    };

    const clearFilters = () => {
        const now = new Date();
        setSelectedMonth(now.getMonth() + 1);
        setSelectedYear(now.getFullYear());
        setSelectedStatus('all');
    };

    if (!isAdmin) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Text className="text-red-500 text-lg font-bold">Access Denied</Text>
                <Text className="text-gray-500 mt-2">Admin only area</Text>
                <TouchableOpacity
                    className="bg-primary px-6 py-3 rounded-xl mt-5"
                    onPress={() => router.back()}
                >
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#FE8C00" />
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
                <Text className="text-xl font-quicksand-bold text-dark-100">Manage Orders</Text>
            </View>

            {/* Filter Section */}
            <View className="bg-white p-4 m-4 rounded-2xl shadow-sm">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="font-quicksand-bold text-dark-100">Filters</Text>
                    <TouchableOpacity onPress={clearFilters}>
                        <Text className="text-primary text-sm font-quicksand-medium">Clear All</Text>
                    </TouchableOpacity>
                </View>

                {/* Quick Filter Buttons */}
                <View className="flex-row gap-2 mb-4">
                    <TouchableOpacity
                        className="flex-1 bg-primary/10 py-2 rounded-xl"
                        onPress={setThisMonth}
                    >
                        <Text className="text-primary text-center text-sm font-quicksand-medium">This Month</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 bg-primary/10 py-2 rounded-xl"
                        onPress={setLastMonth}
                    >
                        <Text className="text-primary text-center text-sm font-quicksand-medium">Last Month</Text>
                    </TouchableOpacity>
                </View>

                {/* Month Selector */}
                <View className="mb-4">
                    <Text className="text-sm text-gray-500 mb-2">Month</Text>
                    <FlatList
                        horizontal
                        data={MONTHS}
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                className={`px-4 py-2 rounded-full mr-2 ${selectedMonth === index + 1 ? 'bg-primary' : 'bg-gray-200'}`}
                                onPress={() => setSelectedMonth(index + 1)}
                            >
                                <Text className={selectedMonth === index + 1 ? 'text-white font-bold' : 'text-gray-700'}>
                                    {item.slice(0, 3)}
                                </Text>
                            </TouchableOpacity>
                        )}
                        showsHorizontalScrollIndicator={false}
                    />
                </View>

                {/* Year and Status Row */}
                <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                        <Text className="text-sm text-gray-500 mb-2">Year</Text>
                        <View className="flex-row gap-2">
                            {[2024, 2025].map(year => (
                                <TouchableOpacity
                                    key={year}
                                    className={`flex-1 py-2 rounded-lg ${selectedYear === year ? 'bg-primary' : 'bg-gray-200'}`}
                                    onPress={() => setSelectedYear(year)}
                                >
                                    <Text className={`text-center ${selectedYear === year ? 'text-white font-bold' : 'text-gray-700'}`}>
                                        {year}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm text-gray-500 mb-2">Status</Text>
                        <View className="flex-row gap-2">
                            {['all', 'pending', 'confirmed', 'delivered'].map(status => (
                                <TouchableOpacity
                                    key={status}
                                    className={`flex-1 py-2 rounded-lg ${selectedStatus === status ? 'bg-primary' : 'bg-gray-200'}`}
                                    onPress={() => setSelectedStatus(status)}
                                >
                                    <Text className={`text-center text-xs ${selectedStatus === status ? 'text-white font-bold' : 'text-gray-700'}`}>
                                        {status.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    className="bg-gray-800 py-3 rounded-xl mt-2"
                    onPress={fetchOrders}
                >
                    <Text className="text-white text-center font-quicksand-bold">Apply Filters</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View className="flex-row gap-3 px-4 mb-4">
                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                    <Text className="text-gray-500 text-sm">Total Orders</Text>
                    <Text className="text-2xl font-quicksand-bold text-primary">{orders.length}</Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                    <Text className="text-gray-500 text-sm">Revenue</Text>
                    <Text className="text-2xl font-quicksand-bold text-green-600">Ksh {getTotalRevenue().toFixed(2)}</Text>
                </View>
            </View>

            {/* Orders List */}
            <FlatList
                data={orders}
                keyExtractor={(item) => item.$id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FE8C00']} />}
                contentContainerClassName="px-4 pb-5"
                ListEmptyComponent={() => (
                    <View className="flex-1 justify-center items-center py-20">
                        <Text className="text-gray-400 text-lg">No orders found</Text>
                        <Text className="text-gray-400 text-sm mt-2">Try changing your filters</Text>
                    </View>
                )}
                renderItem={({ item }) => {
                    const orderItems = getOrderItems(item.items);
                    const firstItem = orderItems[0];

                    return (
                        <TouchableOpacity
                            className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                            onPress={() => viewOrderDetails(item)}
                            activeOpacity={0.7}
                        >
                            <View className="flex-row justify-between items-start mb-2">
                                <View className="flex-1">
                                    <Text className="font-quicksand-bold text-dark-100 text-lg">{item.userName}</Text>
                                    <Text className="text-gray-500 text-sm">{item.userEmail}</Text>
                                </View>
                                <View className={`${getStatusColor(item.status)} px-3 py-1 rounded-full`}>
                                    <Text className="text-white text-xs font-quicksand-bold">{item.status.toUpperCase()}</Text>
                                </View>
                            </View>

                            {/* Order Items Preview with Images */}
                            <View className="mt-2">
                                <Text className="text-gray-600 text-xs font-quicksand-medium mb-1">Items:</Text>
                                {orderItems.slice(0, 2).map((orderItem, idx) => (
                                    <View key={idx} className="flex-row items-center py-1">
                                        {orderItem.image_url ? (
                                            <Image
                                                source={{ uri: orderItem.image_url }}
                                                className="w-8 h-8 rounded-md mr-2"
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View className="w-8 h-8 bg-gray-200 rounded-md mr-2 items-center justify-center">
                                                <Ionicons name="fast-food" size={14} color="#999" />
                                            </View>
                                        )}
                                        <Text className="text-gray-600 text-sm flex-1">
                                            {orderItem.quantity}x {orderItem.name}
                                        </Text>
                                        <Text className="text-gray-600 text-sm font-semibold">
                                            Ksh {(orderItem.price * orderItem.quantity).toFixed(2)}
                                        </Text>
                                    </View>
                                ))}
                                {orderItems.length > 2 && (
                                    <Text className="text-gray-400 text-xs mt-1">
                                        +{orderItems.length - 2} more items
                                    </Text>
                                )}
                            </View>

                            <Text className="text-gray-600 text-sm mt-2">📍 {item.deliveryAddress}</Text>
                            <Text className="text-gray-600 text-sm">
                                📅 {new Date(item.orderDate).toLocaleDateString()} at {new Date(item.orderDate).toLocaleTimeString()}
                            </Text>

                            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                <Text className="text-primary font-quicksand-bold text-lg">Ksh {item.totalAmount.toFixed(2)}</Text>
                                <Text className="text-gray-400 text-xs">Tap for details →</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Order Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl max-h-[85%]">
                        {/* Modal Header */}
                        <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
                            <Text className="text-xl font-quicksand-bold text-dark-100">Order Details</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {selectedOrder && (
                            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
                                {/* Customer Info */}
                                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <Text className="font-quicksand-bold text-dark-100 mb-2">Customer Information</Text>
                                    <Text className="text-gray-700">👤 {selectedOrder.userName}</Text>
                                    <Text className="text-gray-700">📧 {selectedOrder.userEmail}</Text>
                                    <Text className="text-gray-700">📍 {selectedOrder.deliveryAddress}</Text>
                                    <Text className="text-gray-700">📅 {new Date(selectedOrder.orderDate).toLocaleString()}</Text>
                                </View>

                                {/* Order Items with Images */}
                                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <Text className="font-quicksand-bold text-dark-100 mb-3">Order Items ({getTotalItemQuantity(selectedOrder.items)} items)</Text>
                                    {getOrderItems(selectedOrder.items).map((item, idx) => (
                                        <View key={idx} className="flex-row py-3 border-b border-gray-200">
                                            {/* Product Image */}
                                            {item.image_url ? (
                                                <Image
                                                    source={{ uri: item.image_url }}
                                                    className="w-16 h-16 rounded-xl mr-3"
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View className="w-16 h-16 bg-gray-300 rounded-xl mr-3 items-center justify-center">
                                                    <Ionicons name="fast-food" size={24} color="#666" />
                                                </View>
                                            )}

                                            {/* Item Details */}
                                            <View className="flex-1">
                                                <Text className="font-quicksand-bold text-dark-100">{item.name}</Text>
                                                <Text className="text-gray-500 text-sm">Quantity: {item.quantity}</Text>
                                                {item.customizations && item.customizations.length > 0 && (
                                                    <View className="mt-1">
                                                        <Text className="text-gray-400 text-xs">Add-ons:</Text>
                                                        {item.customizations.map((c, i) => (
                                                            <Text key={i} className="text-gray-400 text-xs ml-2">
                                                                • {c.name} (+Ksh {c.price})
                                                            </Text>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>

                                            {/* Price */}
                                            <Text className="font-quicksand-bold text-primary">
                                                Ksh {(item.price * item.quantity).toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Price Summary */}
                                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                                    <Text className="font-quicksand-bold text-dark-100 mb-2">Payment Summary</Text>
                                    <View className="flex-row justify-between py-1">
                                        <Text className="text-gray-600">Subtotal</Text>
                                        <Text className="text-gray-600">Ksh {(selectedOrder.totalAmount + 100 - 200).toFixed(2)}</Text>
                                    </View>
                                    <View className="flex-row justify-between py-1">
                                        <Text className="text-gray-600">Delivery Fee</Text>
                                        <Text className="text-gray-600">Ksh 200</Text>
                                    </View>
                                    <View className="flex-row justify-between py-1">
                                        <Text className="text-gray-600">Discount</Text>
                                        <Text className="text-green-600">- Ksh 100</Text>
                                    </View>
                                    <View className="border-t border-gray-200 my-2" />
                                    <View className="flex-row justify-between py-1">
                                        <Text className="font-quicksand-bold text-dark-100">Total</Text>
                                        <Text className="font-quicksand-bold text-primary text-lg">Ksh {selectedOrder.totalAmount.toFixed(2)}</Text>
                                    </View>
                                </View>

                                {/* Status Update Buttons */}
                                <View className="flex-row gap-3 mb-5">
                                    {selectedOrder.status === 'pending' && (
                                        <TouchableOpacity
                                            className="flex-1 bg-blue-500 py-3 rounded-xl"
                                            onPress={() => updateStatus(selectedOrder.$id, 'confirmed')}
                                        >
                                            <Text className="text-white text-center font-quicksand-bold">Confirm Order</Text>
                                        </TouchableOpacity>
                                    )}
                                    {selectedOrder.status === 'confirmed' && (
                                        <TouchableOpacity
                                            className="flex-1 bg-green-500 py-3 rounded-xl"
                                            onPress={() => updateStatus(selectedOrder.$id, 'delivered')}
                                        >
                                            <Text className="text-white text-center font-quicksand-bold">Mark as Delivered</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}