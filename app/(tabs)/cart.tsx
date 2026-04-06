import {View, Text, FlatList, TouchableOpacity, Alert} from 'react-native'
import {SafeAreaView} from "react-native-safe-area-context";
import {useCartStore} from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import cn from "clsx";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import {PaymentInfoStripeProps} from "@/type";
import { router } from 'expo-router';
import useAuthStore from '@/store/auth.store';

const PaymentInfoStripe = ({ label,  value,  labelStyle,  valueStyle, }: PaymentInfoStripeProps) => (
    <View className="flex-between flex-row my-1">
        <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>
            {label}
        </Text>
        <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>
            {value}
        </Text>
    </View>
);

const Cart = () => {
    const { items, getTotalItems, getTotalPrice } = useCartStore();
    const { user } = useAuthStore();

    const DELIVERY_FEE = 200;
    const DISCOUNT = 100;

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();
    const finalTotal = totalPrice + DELIVERY_FEE - DISCOUNT;

    const handleOrderNow = () => {
        // Check if cart is empty
        if (totalItems === 0) {
            Alert.alert('Cart Empty', 'Please add items to your cart before ordering');
            return;
        }

        // Check if user is logged in
        if (!user) {
            Alert.alert(
                'Login Required',
                'Please login to place an order',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login', onPress: () => router.push('/signin') }  // FIXED: removed (auth)
                ]
            );
            return;
        }

        // Navigate to checkout
        router.push('/checkout');  // FIXED: removed /tabs/
    };

    return (
        <SafeAreaView className="bg-white h-full">
            <FlatList
                data={items}
                renderItem={({ item }) => <CartItem item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerClassName="pb-28 px-5 pt-5"
                ListHeaderComponent={() => <CustomHeader title="Your Cart" />}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center py-20">
                        <Text className="text-gray-400 text-lg">Your cart is empty</Text>
                        <Text className="text-gray-400 text-sm mt-2">Add some delicious food!</Text>
                        <TouchableOpacity
                            className="bg-primary px-6 py-3 rounded-full mt-5"
                            onPress={() => router.push('/')}  // FIXED: go to home
                        >
                            <Text className="text-white font-bold">Browse Food</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListFooterComponent={() => totalItems > 0 && (
                    <View className="gap-5">
                        <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                            <Text className="h3-bold text-dark-100 mb-5">
                                Payment Summary
                            </Text>

                            <PaymentInfoStripe
                                label={`Total Items (${totalItems})`}
                                value={`Ksh ${totalPrice.toFixed(2)}`}
                            />
                            <PaymentInfoStripe
                                label={`Delivery Fee`}
                                value={`Ksh ${DELIVERY_FEE}`}
                            />
                            <PaymentInfoStripe
                                label={`Discount`}
                                value={`- Ksh ${DISCOUNT}`}
                                valueStyle="!text-success"
                            />
                            <View className="border-t border-gray-300 my-2" />
                            <PaymentInfoStripe
                                label={`Total`}
                                value={`Ksh ${finalTotal.toFixed(2)}`}
                                labelStyle="base-bold !text-dark-100"
                                valueStyle="base-bold !text-dark-100 !text-right"
                            />
                        </View>

                        <CustomButton
                            title="Order Now"
                            onPress={handleOrderNow}
                        />
                    </View>
                )}
            />
        </SafeAreaView>
    )
}

export default Cart