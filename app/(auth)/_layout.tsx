import {View, KeyboardAvoidingView, Platform, ScrollView, Dimensions, ImageBackground, Image, ActivityIndicator} from 'react-native'
import {Redirect, Slot} from "expo-router";
import {images} from "@/constants";
import useAuthStore from "@/store/auth.store";

export default function AuthLayout() {
    const { isAuthenticated, isLoading } = useAuthStore();

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#FE8C00" />
            </View>
        );
    }

    // Redirect to tabs (NOT root "/") if authenticated
    if (isAuthenticated) return <Redirect href="/(tabs)" />;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
            <ScrollView className="bg-white h-full" keyboardShouldPersistTaps="handled">
                <View className="w-full relative" style={{ height: Dimensions.get('screen').height / 2.25}}>
                    <ImageBackground source={images.loginGraphic} className="size-full rounded-b-lg" resizeMode="stretch" />
                    <Image source={images.logo} className="self-center size-48 absolute -bottom-16 z-10" />
                </View>
                <Slot />
            </ScrollView>
        </KeyboardAvoidingView>
    )
}