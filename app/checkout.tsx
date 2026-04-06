import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { useCartStore } from '@/store/cart.store';
import useAuthStore from '@/store/auth.store';
import { databases, appwriteConfig, ID } from '@/lib/appwrite';

export default function CheckoutScreen() {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const totalPrice = getTotalPrice();
    const finalTotal = totalPrice + 200 - 100;

    const placeOrder = async () => {
        if (!address.trim()) {
            Alert.alert('Error', 'Please enter your address');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'Please login first');
            router.push('/signin');
            return;
        }

        if (items.length === 0) {
            Alert.alert('Error', 'Your cart is empty');
            return;
        }

        setLoading(true);

        try {
            await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.ordersCollectionId,
                ID.unique(),
                {
                    userId: user.$id,
                    userName: user.name,
                    userEmail: user.email,
                    items: JSON.stringify(items),
                    totalAmount: finalTotal,
                    status: 'pending',
                    deliveryAddress: address,
                    orderDate: new Date().toISOString(),
                }
            );

            clearCart();
            // SIMPLE MESSAGE - NO TRACKING TEXT
            Alert.alert('Order Placed', 'Your order has been received');

        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-5 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Text className="text-2xl">←</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold">Checkout</Text>
            </View>

            <ScrollView className="flex-1 px-5 pt-5">
                <Text className="text-lg font-bold mb-3">Your Order</Text>
                {items.map((item, index) => (
                    <View key={index} className="flex-row justify-between py-2 border-b border-gray-100">
                        <Text>{item.quantity}x {item.name}</Text>
                        <Text className="font-bold">Ksh {(item.price * item.quantity).toFixed(2)}</Text>
                    </View>
                ))}

                <Text className="text-lg font-bold mt-5 mb-2">Delivery Address</Text>
                <TextInput
                    className="border border-gray-300 rounded-xl p-4 mb-5"
                    placeholder="Enter your full address"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={3}
                />

                <View className="border-t border-gray-200 pt-3">
                    <View className="flex-row justify-between py-1">
                        <Text>Subtotal</Text>
                        <Text>Ksh {totalPrice.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between py-1">
                        <Text>Delivery Fee</Text>
                        <Text>Ksh 200</Text>
                    </View>
                    <View className="flex-row justify-between py-1">
                        <Text>Discount</Text>
                        <Text className="text-green-600">- Ksh 100</Text>
                    </View>
                    <View className="flex-row justify-between py-2 mt-2 border-t border-gray-200">
                        <Text className="font-bold text-lg">Total</Text>
                        <Text className="font-bold text-lg text-orange-500">Ksh {finalTotal.toFixed(2)}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    className={`bg-orange-500 py-4 rounded-full mt-5 mb-10 ${loading ? 'opacity-50' : ''}`}
                    onPress={placeOrder}
                    disabled={loading}
                >
                    <Text className="text-white text-center font-bold text-lg">
                        {loading ? 'Placing Order...' : `Place Order - Ksh ${finalTotal.toFixed(2)}`}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}