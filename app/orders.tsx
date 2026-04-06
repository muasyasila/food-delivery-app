import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import useAuthStore from '@/store/auth.store';
import { databases, appwriteConfig, Query } from '@/lib/appwrite';
import { Ionicons } from '@expo/vector-icons';

interface Order {
    $id: string;
    totalAmount: number;
    status: string;
    orderDate: string;
    items: string;
    deliveryAddress: string;
}

export default function MyOrdersScreen() {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMyOrders();
        }
    }, [user]);

    const fetchMyOrders = async () => {
        try {
            const response = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.ordersCollectionId,
                [Query.equal('userId', user?.$id), Query.orderDesc('orderDate')]
            );
            setOrders(response.documents as Order[]);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
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

    const getItemCount = (itemsString: string) => {
        try {
            const items = JSON.parse(itemsString);
            return items.length;
        } catch {
            return 0;
        }
    };

    if (!user) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Text className="text-gray-500">Please login to see your orders</Text>
                <TouchableOpacity
                    className="bg-primary px-6 py-3 rounded-full mt-4"
                    onPress={() => router.push('/signin')}
                >
                    <Text className="text-white font-bold">Login</Text>
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
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-5 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="text-xl font-bold">My Orders</Text>
            </View>

            {orders.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                    <Ionicons name="receipt-outline" size={80} color="#ccc" />
                    <Text className="text-gray-400 text-lg mt-4">No orders yet</Text>
                    <Text className="text-gray-400 text-sm mt-2">Start ordering some food!</Text>
                    <TouchableOpacity
                        className="bg-primary px-6 py-3 rounded-full mt-5"
                        onPress={() => router.push('/')}
                    >
                        <Text className="text-white font-bold">Browse Menu</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.$id}
                    contentContainerClassName="p-4"
                    renderItem={({ item }) => (
                        <View className="bg-gray-50 rounded-xl p-4 mb-3">
                            <View className="flex-row justify-between items-start">
                                <View>
                                    <Text className="font-bold text-lg">Order #{item.$id.slice(-6)}</Text>
                                    <Text className="text-gray-500 text-sm mt-1">
                                        {new Date(item.orderDate).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View className={`${getStatusColor(item.status)} px-3 py-1 rounded-full`}>
                                    <Text className="text-white text-xs font-bold">{item.status.toUpperCase()}</Text>
                                </View>
                            </View>

                            <Text className="text-gray-600 text-sm mt-2">📦 {getItemCount(item.items)} item(s)</Text>
                            <Text className="text-gray-600 text-sm">📍 {item.deliveryAddress}</Text>

                            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
                                <Text className="text-primary font-bold text-lg">Ksh {item.totalAmount.toFixed(2)}</Text>
                            </View>
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}