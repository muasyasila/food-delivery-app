import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, Image, Pressable, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { Fragment } from "react";
import cn from 'clsx';
import { router } from "expo-router";

import CartButton from "@/components/CartButton";
import { images, offers } from "@/constants";
import useAuthStore from "@/store/auth.store";

import MapView from 'react-native-maps';

// Mock data for new sections with placeholder images from the internet
const trendingItems = [
    {
        id: '1',
        name: 'Double Cheeseburger',
        price: 300,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
        orders: 234
    },
    {
        id: '2',
        name: 'Chicken Wings',
        price: 450,
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=200&h=200&fit=crop',
        orders: 189
    },
    {
        id: '3',
        name: 'Margherita Pizza',
        price: 800,
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=200&h=200&fit=crop',
        orders: 156
    },
    {
        id: '4',
        name: 'Caesar Salad',
        price: 300,
        image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=200&h=200&fit=crop',
        orders: 142
    },
];

const categories = [
    { id: '6999649f000bd6a4e481', name: 'Burgers', icon: '🍔', color: '#FFE5D3' },
    { id: '699964a100054a125937', name: 'Bowls', icon: '🥗', color: '#E0F2E9' },
    { id: '6999649f00231bb6460b', name: 'Pizzas', icon: '🍕', color: '#FFE0E0' },
    { id: '6999649f003a62338f9a', name: 'Burritos', icon: '🌯', color: '#FFF3E0' },
];

export default function Index() {
    const { user } = useAuthStore();

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning ☀️";
        if (hour < 18) return "Good Afternoon 🌤️";
        return "Good Evening 🌙";
    };

    const handleOfferPress = (offerTitle: string) => {
        const categoryMap: { [key: string]: string } = {
            "BURGER BASH": "6999649f000bd6a4e481",
            "SUMMER COMBO": "699964a100054a125937",
            "PIZZA PARTY": "6999649f00231bb6460b",
            "BURRITO DELIGHT": "6999649f003a62338f9a"
        };

        const categoryId = categoryMap[offerTitle];
        if (categoryId) {
            router.push({
                pathname: "/(tabs)/search",
                params: { category: categoryId }
            });
        }
    };

    const renderHeader = () => (
        <View className="px-5">
            {/* Enhanced Header with Greeting */}
            <View className="flex-row justify-between items-center py-3">
                <View>
                    <Text className="text-sm text-gray-100 font-quicksand-medium">
                        {getGreeting()}
                    </Text>
                    <View className="flex-row items-center gap-x-1 mt-1">
                        <Text className="text-xl font-quicksand-bold text-dark-100">
                            {user?.name || "Guest"} 👋
                        </Text>
                    </View>
                </View>
                <CartButton />
            </View>

            {/* Search Bar - Navigates to search screen */}
            <TouchableOpacity
                onPress={() => router.push("/(tabs)/search")}
                className="mt-3 mb-4"
            >
                <View className="flex-row items-center bg-gray-100/20 rounded-2xl px-4 py-3">
                    <Image source={images.search} className="w-5 h-5" tintColor="#878787" />
                    <Text className="flex-1 ml-3 text-gray-100 font-quicksand">
                        Search for burgers, pizzas...
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Quick Categories Row - Centered */}
            <View className="mb-6">
                <Text className="text-lg font-quicksand-bold text-dark-100 mb-3">
                    Browse Categories
                </Text>
                <View className="flex-row justify-center">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            justifyContent: 'center',
                            paddingHorizontal: 0
                        }}
                    >
                        {categories.map((category, index) => (
                            <TouchableOpacity
                                key={category.id}
                                onPress={() => router.push({
                                    pathname: "/(tabs)/search",
                                    params: { category: category.id }
                                })}
                                className="items-center mx-2"
                                style={{
                                    marginLeft: index === 0 ? 0 : 8,
                                    marginRight: index === categories.length - 1 ? 0 : 8
                                }}
                            >
                                <View
                                    className="w-20 h-20 rounded-2xl items-center justify-center shadow-sm"
                                    style={{ backgroundColor: category.color }}
                                >
                                    <Text className="text-3xl">{category.icon}</Text>
                                </View>
                                <Text className="text-sm font-quicksand-medium text-dark-100 mt-2">
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {/* Trending Now Section */}
            <View className="mb-6">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-lg font-quicksand-bold text-dark-100">
                        🔥 Trending Now
                    </Text>
                    <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
                        <Text className="text-primary font-quicksand-medium">See All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    {trendingItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            className="mr-4 w-40"
                            onPress={() => {/* Navigate to item detail - you can implement this later */}}
                        >
                            <View className="bg-white rounded-2xl p-3 shadow-lg">
                                <Image
                                    source={{ uri: item.image }}
                                    className="w-full h-24 rounded-xl"
                                    resizeMode="cover"
                                />
                                <Text className="font-quicksand-bold text-dark-100 mt-2" numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <View className="flex-row justify-between items-center mt-1">
                                    <Text className="text-primary font-quicksand-bold">Ksh {item.price}</Text>
                                    <View className="flex-row items-center">
                                        <Text className="text-xs text-gray-100">🔥 {item.orders}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Deliver To Section */}
            <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-xs font-quicksand-medium text-primary uppercase tracking-wider">
                        Deliver To
                    </Text>
                    <TouchableOpacity className="flex-row items-center gap-x-1 mt-1">
                        <Text className="text-base font-quicksand-bold text-dark-100">Buruburu</Text>
                        <Image source={images.arrowDown} className="w-3 h-3" tintColor="#FE8C00" />
                    </TouchableOpacity>
                </View>
                <Text className="text-xs font-quicksand-medium text-gray-100">📍 15-20 min</Text>
            </View>

            {/* Special Offers Title */}
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xl font-quicksand-bold text-dark-100">
                    Special Offers
                </Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
                    <Text className="text-primary font-quicksand-medium">View All</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOfferCard = ({ item, index }: { item: typeof offers[0], index: number }) => {
        const isEven = index % 2 === 0;

        return (
            <Pressable
                className={cn(
                    "flex-row mx-5 mb-4 rounded-2xl overflow-hidden",
                    isEven ? 'flex-row-reverse' : 'flex-row'
                )}
                style={{ backgroundColor: item.color }}
                android_ripple={{ color: "#ffffff22" }}
                onPress={() => handleOfferPress(item.title)}
            >
                <View className="w-1/2 h-40">
                    <Image
                        source={item.image}
                        className="w-full h-full"
                        resizeMode="contain"
                    />
                </View>

                <View className={cn(
                    "flex-1 justify-center p-4",
                    isEven ? 'items-end' : 'items-start'
                )}>
                    <Text className="text-xl font-quicksand-bold text-white mb-2">
                        {item.title}
                    </Text>
                    <View className="flex-row items-center">
                        <Text className="text-white/90 font-quicksand-medium text-sm mr-2">
                            Order Now
                        </Text>
                        <Image
                            source={images.arrowRight}
                            className="w-5 h-5"
                            resizeMode="contain"
                            tintColor="#ffffff"
                        />
                    </View>
                </View>
            </Pressable>
        );
    };



    return (
        <SafeAreaView className="flex-1 bg-white">
            <FlatList
                data={offers}
                renderItem={renderOfferCard}
                keyExtractor={(item) => item.title}
                contentContainerClassName="pb-28"
                ListHeaderComponent={renderHeader}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}