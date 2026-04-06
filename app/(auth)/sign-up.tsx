import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { Link, router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState } from "react";
import { createUser } from "@/lib/appwrite";
import * as Sentry from '@sentry/react-native';
import useAuthStore from "@/store/auth.store";

const SignUp = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const { fetchAuthenticatedUser } = useAuthStore();

    const submit = async () => {
        const { name, email, password } = form;

        if (!name || !email || !password) {
            return Alert.alert('Error', 'Please fill in all fields.');
        }

        if (password.length < 8) {
            return Alert.alert('Error', 'Password must be at least 8 characters long.');
        }

        setIsSubmitting(true);

        try {
            await createUser({ email, password, name });
            // Fetch user data after successful sign up
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
                Alert.alert('Error', error.message || 'Sign up failed');
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
                    <View className="gap-8 bg-white rounded-lg p-5 mt-5 pb-10">
                        <CustomInput
                            placeholder="Enter your full name"
                            value={form.name}
                            onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
                            label="Full name"
                            autoCapitalize="words"
                            autoCorrect={false}
                        />
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
                            title="Sign Up"
                            isLoading={isSubmitting}
                            onPress={submit}
                        />

                        <View className="flex justify-center mt-5 flex-row gap-2">
                            <Text className="base-regular text-gray-100">
                                Already have an account?
                            </Text>
                            <Link href="/sign-in" className="base-bold text-primary">
                                Sign In
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

export default SignUp