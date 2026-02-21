import { Text, View, TouchableOpacity, Image, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { databases, account } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { images } from '@/constants';
import * as Sentry from '@sentry/react-native';
import { appwriteConfig } from '@/lib/appwrite';
import cn from 'clsx';

const EditProfile = () => {
    const { user, setUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: user?.address || '',
    });

    // Track changes
    useEffect(() => {
        const originalName = user?.name || '';
        const originalPhone = user?.phone || '';
        const originalAddress = user?.address || '';

        const changed =
            form.name !== originalName ||
            form.phone !== originalPhone ||
            form.address !== originalAddress;

        setHasChanges(changed);
    }, [form, user]);

    const handleBack = () => {
        if (hasChanges) {
            Alert.alert(
                "Unsaved Changes",
                "You have unsaved changes. Are you sure you want to go back?",
                [
                    {
                        text: "Stay",
                        style: "cancel"
                    },
                    {
                        text: "Discard",
                        onPress: () => router.back(),
                        style: "destructive"
                    }
                ]
            );
        } else {
            router.back();
        }
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setIsLoading(true);
        try {
            // Update name in Appwrite Account
            await account.updateName(form.name);

            // Update user document in database
            await databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                user?.$id!,
                {
                    name: form.name,
                    phone: form.phone,
                    address: form.address,
                }
            );

            // Update local user state
            setUser({
                ...user!,
                name: form.name,
                phone: form.phone,
                address: form.address,
            });

            Alert.alert('Success', 'Profile updated successfully!');
            router.back();
        } catch (error) {
            console.error('Save error:', error);
            Sentry.captureException(error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
                <TouchableOpacity
                    onPress={handleBack}
                    className="w-10 h-10 items-center justify-center"
                >
                    <Image source={images.arrowBack} className="w-5 h-5" style={{ tintColor: '#333' }} resizeMode="contain" />
                </TouchableOpacity>
                <Text className="text-xl font-quicksand-bold text-dark-100">Edit Profile</Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isLoading || !hasChanges}
                    className="px-4 py-2"
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FE8C00" />
                    ) : (
                        <Text className={cn(
                            "font-quicksand-bold",
                            hasChanges ? "text-primary" : "text-gray-300"
                        )}>
                            Save
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 px-5"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Person Icon */}
                <View className="items-center mt-6 mb-8">
                    <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center">
                        <Image
                            source={images.person}
                            className="w-12 h-12"
                            style={{ tintColor: '#FE8C00' }}
                            resizeMode="contain"
                        />
                    </View>
                    <Text className="text-sm text-gray-400 font-quicksand-medium mt-2">
                        Profile Photo
                    </Text>
                </View>

                {/* Form Fields */}
                <View className="space-y-4 mb-8">
                    <View>
                        <Text className="text-sm text-gray-500 font-quicksand-medium mb-2">Full Name</Text>
                        <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                            <Image source={images.user} className="w-5 h-5 mr-3" style={{ tintColor: '#FE8C00' }} resizeMode="contain" />
                            <TextInput
                                className="flex-1 font-quicksand-medium text-dark-100"
                                placeholder="Enter your name"
                                placeholderTextColor="#9CA3AF"
                                value={form.name}
                                onChangeText={(text) => setForm({ ...form, name: text })}
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-sm text-gray-500 font-quicksand-medium mb-2">Phone Number</Text>
                        <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                            <Image source={images.phone} className="w-5 h-5 mr-3" style={{ tintColor: '#FE8C00' }} resizeMode="contain" />
                            <TextInput
                                className="flex-1 font-quicksand-medium text-dark-100"
                                placeholder="Add phone number"
                                placeholderTextColor="#9CA3AF"
                                value={form.phone}
                                onChangeText={(text) => setForm({ ...form, phone: text })}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="text-sm text-gray-500 font-quicksand-medium mb-2">Default Address</Text>
                        <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                            <Image source={images.location} className="w-5 h-5 mr-3" style={{ tintColor: '#FE8C00' }} resizeMode="contain" />
                            <TextInput
                                className="flex-1 font-quicksand-medium text-dark-100"
                                placeholder="Add delivery address"
                                placeholderTextColor="#9CA3AF"
                                value={form.address}
                                onChangeText={(text) => setForm({ ...form, address: text })}
                                multiline
                            />
                        </View>
                    </View>
                </View>

                {/* Save Changes Button */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={isLoading || !hasChanges}
                    className={cn(
                        'bg-primary py-4 rounded-xl mb-8 flex-row items-center justify-center',
                        (!hasChanges || isLoading) && 'opacity-50'
                    )}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text className="text-white font-quicksand-bold text-base">
                            Save Changes
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default EditProfile;