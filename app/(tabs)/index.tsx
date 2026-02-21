import {SafeAreaView} from "react-native-safe-area-context";
import { FlatList, Image, Pressable, Text, TouchableOpacity, View} from "react-native";
import {Fragment} from "react";
import cn from 'clsx';
import { router } from "expo-router";

import CartButton from "@/components/CartButton";
import {images, offers} from "@/constants";
import useAuthStore from "@/store/auth.store";

export default function Index() {
    const { user } = useAuthStore();

    // Function to handle offer card press
    const handleOfferPress = (offerTitle: string) => {
        console.log("Pressed offer:", offerTitle);

        // Map offer titles to actual category IDs from your database
        const categoryMap: { [key: string]: string } = {
            "BURGER BASH": "6999649f000bd6a4e481",  // Burgers ID
            "SUMMER COMBO": "699964a100054a125937", // Bowls
            "PIZZA PARTY": "6999649f00231bb6460b",   // Pizzas ID
            "BURRITO DELIGHT": "6999649f003a62338f9a" // Burritos ID
        };

        const categoryId = categoryMap[offerTitle];
        console.log("Mapped category ID:", categoryId);

        // Navigate to search screen with the category ID
        if (categoryId) {
            console.log("Navigating with category ID:", categoryId);
            router.push({
                pathname: "/(tabs)/search",
                params: { category: categoryId }
            });
        } else {
            console.log("No category mapping found for:", offerTitle);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <FlatList
                data={offers}
                renderItem={({ item, index }) => {
                    const isEven = index % 2 === 0;

                    return (
                        <View>
                            <Pressable
                                className={cn("offer-card", isEven ? 'flex-row-reverse' : 'flex-row')}
                                style={{ backgroundColor: item.color }}
                                android_ripple={{ color: "#fffff22"}}
                                onPress={() => handleOfferPress(item.title)}
                            >
                                {({ pressed }) => (
                                    <Fragment>
                                        <View className={"h-full w-1/2"}>
                                            <Image source={item.image} className={"size-full"} resizeMode={"contain"} />
                                        </View>

                                        <View className={cn("offer-card__info", isEven ? 'pl-10': 'pr-10')}>
                                            <Text className="h1-bold text-white leading-tight">
                                                {item.title}
                                            </Text>
                                            <Image
                                                source={images.arrowRight}
                                                className="size-10"
                                                resizeMode="contain"
                                                tintColor="#ffffff"
                                            />
                                        </View>
                                    </Fragment>
                                )}
                            </Pressable>
                        </View>
                    )
                }}
                contentContainerClassName="pb-28 px-5"
                ListHeaderComponent={() => (
                    <View className="flex-between flex-row w-full my-5">
                        <View className="flex-start">
                            <Text className="small-bold text-primary">DELIVER TO</Text>
                            <TouchableOpacity className="flex-center flex-row gap-x-1 mt-0.5">
                                <Text className="paragraph-bold text-dark-100">BuruBuru</Text>
                                <Image source={images.arrowDown} className="size-3" resizeMode="contain" />
                            </TouchableOpacity>
                        </View>

                        <CartButton />
                    </View>
                )}
            />
        </SafeAreaView>
    );
}