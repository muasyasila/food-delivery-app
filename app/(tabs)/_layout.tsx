import {Redirect, Tabs} from "expo-router";
import useAuthStore from "@/store/auth.store";
import {TabBarIconProps} from "@/type";
import {Image, Text, View, ActivityIndicator, Platform} from "react-native";
import {images} from "@/constants";
import cn from "clsx";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => (
    <View className="items-center justify-center">
        <Image
            source={icon}
            className="size-6 mb-1"
            resizeMode="contain"
            tintColor={focused ? '#FE8C00' : '#9CA3AF'}
        />
        <Text
            className={cn(
                'text-xs font-medium',
                focused ? 'text-[#FE8C00]' : 'text-gray-400'
            )}
            numberOfLines={1}
        >
            {title}
        </Text>
    </View>
)

export default function TabLayout() {
    const { isAuthenticated, isLoading } = useAuthStore();
    const insets = useSafeAreaInsets();

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#FE8C00" />
            </View>
        );
    }

    // Redirect to sign-in if not authenticated
    if (!isAuthenticated) return <Redirect href="/(auth)/sign-in" />;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 20 + insets.bottom : 16 + insets.bottom,
                    left: 20,
                    right: 20,
                    height: 65,
                    backgroundColor: 'white',
                    borderRadius: 30,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 8,
                    borderTopWidth: 0,
                    paddingBottom: Platform.OS === 'ios' ? 0 : 5,
                    paddingTop: 8,
                },
                tabBarItemStyle: {
                    paddingVertical: 5,
                },
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Home" icon={images.home} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='search'
                options={{
                    title: 'Search',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Search" icon={images.search} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='cart'
                options={{
                    title: 'Cart',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Cart" icon={images.bag} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='profile'
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Profile" icon={images.person} focused={focused} />
                }}
            />
        </Tabs>
    );
}