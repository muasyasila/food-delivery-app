import { View, Text, Image, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { appwriteConfig } from '@/lib/appwrite';
import { useCartStore } from '@/store/cart.store';
import { MenuItem } from '@/type';
import CustomButton from '@/components/CustomButton';
import { databases } from '@/lib/appwrite';

export default function ItemDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [item, setItem] = useState<MenuItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const { addItem } = useCartStore();

    useEffect(() => {
        if (id) {
            fetchItemDetails();
        }
    }, [id]);

    const fetchItemDetails = async () => {
        try {
            setLoading(true);
            const menuItem = await databases.getDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCollectionId,
                id
            );
            setItem(menuItem as MenuItem);
        } catch (error) {
            console.error('Error fetching item:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!item) return;

        for (let i = 0; i < quantity; i++) {
            addItem({
                id: item.$id,
                name: item.name,
                price: item.price,
                image_url: item.image_url || '',
                customizations: []
            });
        }

        alert(`Added ${quantity} ${item.name} to cart!`);
        router.back();
    };

    // Safe image URL construction
    const getImageUrl = () => {
        if (!item?.image_url) {
            return null;
        }

        if (item.image_url.includes('project=')) {
            return item.image_url;
        }

        const separator = item.image_url.includes('?') ? '&' : '?';
        return `${item.image_url}${separator}project=${appwriteConfig.projectId}`;
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <StatusBar barStyle="dark-content" />
                <Text className="font-quicksand">Loading...</Text>
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center">
                <StatusBar barStyle="dark-content" />
                <Text className="font-quicksand">Item not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                    <Text className="text-primary font-quicksand-medium">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const imageUrl = getImageUrl();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />
            <View className="flex-1 bg-white">
                {/* Header - always visible */}
                <SafeAreaView edges={['top']} className="bg-white">
                    <View className="px-5 py-3 flex-row items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
                        >
                            <Ionicons name="arrow-back" size={24} color="#181C2E" />
                        </TouchableOpacity>
                        <Text className="flex-1 text-center font-quicksand-bold text-dark-100 text-lg">
                            Item Details
                        </Text>
                        <View className="w-10" />
                    </View>
                </SafeAreaView>

                {/* Scrollable Content */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Item Image */}
                    <View className="items-center mt-4">
                        <View className="w-72 h-72 bg-orange-50 rounded-3xl items-center justify-center">
                            {imageUrl ? (
                                <Image
                                    source={{ uri: imageUrl }}
                                    className="w-64 h-64"
                                    resizeMode="contain"
                                    onError={(e) => console.log('Image failed to load:', e.nativeEvent.error)}
                                />
                            ) : (
                                <View className="w-64 h-64 items-center justify-center">
                                    <Text className="text-6xl">🍔</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Item Info */}
                    <View className="px-5 mt-6">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-3xl font-quicksand-bold text-dark-100 flex-1">
                                {item.name || 'Unknown Item'}
                            </Text>
                            <View className="flex-row items-center bg-orange-100 px-3 py-1.5 rounded-full">
                                <Ionicons name="star" size={18} color="#FE8C00" />
                                <Text className="ml-1 font-quicksand-bold text-dark-100">
                                    {item.rating?.toFixed(1) || '4.5'}
                                </Text>
                            </View>
                        </View>

                        {/* Description */}
                        <View className="mt-4">
                            <Text className="font-quicksand-bold text-dark-100 text-lg mb-2">
                                Description
                            </Text>
                            <Text className="font-quicksand text-gray-100 leading-6">
                                {item.description || 'No description available'}
                            </Text>
                        </View>

                        {/* Nutritional Info */}
                        <View className="mt-6 flex-row justify-between bg-gray-50 p-4 rounded-2xl">
                            <View className="items-center flex-1">
                                <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-2">
                                    <Ionicons name="flame" size={24} color="#FE8C00" />
                                </View>
                                <Text className="font-quicksand-bold text-dark-100">
                                    {item.calories || 0}
                                </Text>
                                <Text className="font-quicksand text-gray-100 text-xs">Calories</Text>
                            </View>
                            <View className="items-center flex-1">
                                <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-2">
                                    <Ionicons name="barbell" size={24} color="#FE8C00" />
                                </View>
                                <Text className="font-quicksand-bold text-dark-100">
                                    {item.protein || 0}g
                                </Text>
                                <Text className="font-quicksand text-gray-100 text-xs">Protein</Text>
                            </View>
                            <View className="items-center flex-1">
                                <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mb-2">
                                    <Ionicons name="time" size={24} color="#FE8C00" />
                                </View>
                                <Text className="font-quicksand-bold text-dark-100">
                                    15-20
                                </Text>
                                <Text className="font-quicksand text-gray-100 text-xs">min</Text>
                            </View>
                        </View>

                        {/* Quantity Selector */}
                        <View className="mt-8">
                            <Text className="font-quicksand-bold text-dark-100 text-lg mb-3">
                                Quantity
                            </Text>
                            <View className="flex-row items-center justify-between bg-gray-50 p-2 rounded-2xl">
                                <TouchableOpacity
                                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-14 h-14 bg-white rounded-xl items-center justify-center shadow-sm"
                                >
                                    <Ionicons name="remove" size={24} color="#FE8C00" />
                                </TouchableOpacity>

                                <Text className="text-2xl font-quicksand-bold text-dark-100">
                                    {quantity}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => setQuantity(quantity + 1)}
                                    className="w-14 h-14 bg-white rounded-xl items-center justify-center shadow-sm"
                                >
                                    <Ionicons name="add" size={24} color="#FE8C00" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Price Summary */}
                        <View className="mt-8 bg-orange-50 p-4 rounded-2xl">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="font-quicksand text-gray-100">Price per item</Text>
                                <Text className="text-xl font-quicksand-bold text-primary">
                                    Ksh {item.price || 0}
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-center pt-2 border-t border-orange-200">
                                <Text className="font-quicksand-bold text-dark-100 text-lg">Total</Text>
                                <Text className="text-2xl font-quicksand-bold text-primary">
                                    Ksh {(item.price || 0) * quantity}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Fixed Add to Cart Button at Bottom */}
                <SafeAreaView edges={['bottom']} className="bg-white">
                    <View className="px-5 py-3 border-t border-gray-100">
                        <TouchableOpacity
                            onPress={handleAddToCart}
                            className="bg-primary py-4 rounded-2xl shadow-lg"
                            activeOpacity={0.8}
                        >
                            <Text className="text-white font-quicksand-bold text-lg text-center">
                                Add {quantity > 1 ? `${quantity} items` : 'to cart'} • Ksh {(item.price || 0) * quantity}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </>
    );
}