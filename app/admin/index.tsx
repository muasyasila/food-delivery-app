import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import useAuthStore from '@/store/auth.store';
import { images } from '@/constants';
import { Image } from 'react-native';

export default function AdminDashboard() {
    const { user } = useAuthStore();

    const isAdmin = user?.email === 'curtissilaadmin@gmail.com';

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

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header with back button */}
            <View className="flex-row items-center px-5 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Image source={images.arrowBack} className="w-5 h-5" style={{ tintColor: '#333' }} />
                </TouchableOpacity>
                <Text className="text-xl font-quicksand-bold text-dark-100">Admin Panel</Text>
            </View>

            <ScrollView className="flex-1 p-5">
                <View className="bg-primary/10 rounded-2xl p-5 mb-6">
                    <Text className="text-lg font-quicksand-bold text-dark-100">
                        Welcome, {user?.name}!
                    </Text>
                    <Text className="text-gray-500 mt-1">
                        Manage your food delivery app
                    </Text>
                </View>

                {/* Manage Foods Button */}
                <TouchableOpacity
                    className="bg-primary p-5 rounded-2xl mb-4 shadow-md"
                    onPress={() => router.push('/admin/manage-foods')}
                >
                    <Text className="text-white text-center font-bold text-lg">🍔 Manage Foods</Text>
                    <Text className="text-white/80 text-center text-sm mt-1">Add, edit, or remove menu items</Text>
                </TouchableOpacity>

                {/* View Orders Button */}
                <TouchableOpacity
                    className="bg-green-500 p-5 rounded-2xl mb-4 shadow-md"
                    onPress={() => router.push('/admin/orders')}
                >
                    <Text className="text-white text-center font-bold text-lg">📦 View Orders</Text>
                    <Text className="text-white/80 text-center text-sm mt-1">Track customer orders</Text>
                </TouchableOpacity>

                {/* Reports Button - NEW */}
                <TouchableOpacity
                    className="bg-purple-500 p-5 rounded-2xl mb-4 shadow-md"
                    onPress={() => router.push('/admin/reports')}
                >
                    <Text className="text-white text-center font-bold text-lg">📊 Reports</Text>
                    <Text className="text-white/80 text-center text-sm mt-1">Generate sales reports</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}