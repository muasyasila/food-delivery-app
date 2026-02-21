import {View, Text, Alert} from 'react-native'
import {Link, router} from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import {useState, useEffect} from "react";
import {createUser, account} from "@/lib/appwrite";

const SignUp = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [form, setForm] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        checkExistingSession();
    }, []);

    const checkExistingSession = async () => {
        try {
            const session = await account.get();
            if (session) {
                router.replace('/(tabs)');
            }
        } catch (error) {
            console.log('No active session');
        } finally {
            setIsChecking(false);
        }
    };

    const submit = async () => {
        const { name, email, password } = form;

        if(!name || !email || !password) {
            return Alert.alert('Error', 'Please fill in all fields.');
        }

        setIsSubmitting(true);

        try {
            await createUser({ email, password, name });
            router.replace('/(tabs)');
        } catch(error: any) {
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
                Alert.alert('Error', error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isChecking) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="font-quicksand-medium text-gray-500">Checking session...</Text>
            </View>
        );
    }

    return (
        <View className="gap-10 bg-white rounded-lg p-5 mt-5">
            <CustomInput
                placeholder="Enter your full name"
                value={form.name}
                onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
                label="Full name"
            />
            <CustomInput
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                label="Email"
                keyboardType="email-address"
            />
            <CustomInput
                placeholder="Enter your password"
                value={form.password}
                onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                label="Password"
                secureTextEntry={true}
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
    )
}

export default SignUp