import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { Link, router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState } from "react";
import { signIn } from "@/lib/appwrite";
import * as Sentry from '@sentry/react-native'
import useAuthStore from "@/store/auth.store";

const SignIn = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });
    const { fetchAuthenticatedUser } = useAuthStore();

    const submit = async () => {
        const { email, password } = form;

        if (!email || !password) {
            return Alert.alert('Error', 'Please enter valid email address & password.');
        }

        setIsSubmitting(true);

        try {
            await signIn({ email, password });
            // Fetch user data after successful sign in
            await fetchAuthenticatedUser();
            router.replace('/(tabs)');
        } catch (error: any) {
            if (error.message?.includes('session is active')) {
                Alert.alert(
                    'Session Active',
                    'You are already logged in.',
                    [
                        {
                            text: 'Go to Home',
                            onPress: () => router.replace('/(tabs)')
                        }
                    ]
                );
            } else {
                Alert.alert('Error', error.message || 'Sign in failed');
            }
            Sentry.captureException(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    className="flex-1 bg-white"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="gap-10 bg-white rounded-lg p-5 mt-5 pb-10">
                        <CustomInput
                            placeholder="Enter your email"
                            value={form.email}
                            onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                            label="Email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <CustomInput
                            placeholder="Enter your password"
                            value={form.password}
                            onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                            label="Password"
                            secureTextEntry={true}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <CustomButton
                            title="Sign In"
                            isLoading={isSubmitting}
                            onPress={submit}
                        />

                        <View className="flex justify-center mt-5 flex-row gap-2">
                            <Text className="base-regular text-gray-100">
                                Don't have an account?
                            </Text>
                            <Link href="/sign-up" className="base-bold text-primary">
                                Sign Up
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

export default SignIn