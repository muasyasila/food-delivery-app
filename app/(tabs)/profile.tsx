import { Text, View, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from 'expo-router';
import { signOut } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { images } from '@/constants';
import * as Sentry from '@sentry/react-native';
import { useState } from 'react';
import cn from 'clsx';

const Profile = () => {
    const { user, setUser, setIsAuthenticated } = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Sign Out",
                    onPress: async () => {
                        try {
                            setIsLoggingOut(true);

                            setUser(null);
                            setIsAuthenticated(false);

                            try {
                                await signOut();
                            } catch (error) {
                                console.log('Sign out error (continuing anyway):', error);
                            }

                            router.replace('/signin');

                        } catch (error) {
                            Sentry.captureException(error);
                            Alert.alert('Error', 'Failed to sign out. Please try again.');
                        } finally {
                            setIsLoggingOut(false);
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const InfoCard = ({ label, value, icon }: { label: string; value: string; icon: any }) => (
        <View className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3">
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
                <Image source={icon} className="w-5 h-5" style={{ tintColor: '#FE8C00' }} resizeMode="contain" />
            </View>
            <View className="flex-1">
                <Text className="text-xs text-gray-500 font-quicksand-medium">{label}</Text>
                <Text className="text-base text-dark-100 font-quicksand-medium mt-0.5">{value || 'Not provided'}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between px-5 py-4">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <Image source={images.arrowBack} className="w-5 h-5" style={{ tintColor: '#333' }} resizeMode="contain" />
                </TouchableOpacity>
                <Text className="text-xl font-quicksand-bold text-dark-100">Profile</Text>
                <View className="w-10 h-10" />
            </View>

            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Profile Header with Person Icon */}
                <View className="items-center mb-6">
                    <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
                        <Image
                            source={images.person}
                            className="w-10 h-10"
                            style={{ tintColor: '#FE8C00' }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text className="text-2xl font-quicksand-bold text-dark-100 mt-3">
                        {user?.name || 'User Name'}
                    </Text>
                    <Text className="text-sm text-gray-400 font-quicksand-medium">
                        Member since February 2026
                    </Text>
                </View>

                {/* Contact Information */}
                <View className="mb-6">
                    <InfoCard
                        label="Email"
                        value={user?.email || 'Not provided'}
                        icon={images.envelope}
                    />

                    <InfoCard
                        label="Phone"
                        value={user?.phone || 'Add phone number'}
                        icon={images.phone}
                    />

                    <InfoCard
                        label="Default Address"
                        value={user?.address || 'Add delivery address'}
                        icon={images.location}
                    />
                </View>

                {/* Edit Profile Button */}
                <TouchableOpacity
                    onPress={() => router.push('/edit-profile')}
                    className="bg-primary py-4 rounded-xl mb-4 flex-row items-center justify-center"
                >
                    <Image
                        source={images.pencil}
                        className="w-5 h-5 mr-2"
                        style={{ tintColor: '#FFFFFF' }}
                        resizeMode="contain"
                    />
                    <Text className="text-white font-quicksand-bold text-base">
                        Edit Profile
                    </Text>
                </TouchableOpacity>

                {/* Sign Out Button */}
                <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-red-50 py-4 rounded-xl mb-8 flex-row items-center justify-center border border-red-200"
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? (
                        <ActivityIndicator size="small" color="#FF3B30" />
                    ) : (
                        <>
                            <Image
                                source={images.logout}
                                className="w-5 h-5 mr-2"
                                style={{ tintColor: '#FF3B30' }}
                                resizeMode="contain"
                            />
                            <Text className="text-red-500 font-quicksand-bold text-base">
                                Sign Out
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;