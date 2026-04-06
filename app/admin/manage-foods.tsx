import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Modal, FlatList, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { databases, storage, appwriteConfig, ID } from '@/lib/appwrite';
import useAuthStore from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Use appwriteConfig instead of process.env
const DATABASE_ID = appwriteConfig.databaseId;
const MENU_COLLECTION_ID = appwriteConfig.menuCollectionId;
const CATEGORIES_COLLECTION_ID = appwriteConfig.categoriesCollectionId;
const BUCKET_ID = appwriteConfig.bucketId;

interface FoodItem {
    $id: string;
    name: string;
    description: string;
    price: number;
    imageURL: string;
    rating: number;
    category: string;
    calories: number;
    protein: number;
}

interface Category {
    $id: string;
    name: string;
}

export default function ManageFoods() {
    const { user } = useAuthStore();
    const [foods, setFoods] = useState<FoodItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        imageURL: '',
        category: '',
        calories: '',
        protein: ''
    });

    const isAdmin = user?.email === 'curtissilaadmin@gmail.com';

    useEffect(() => {
        if (isAdmin) {
            fetchFoods();
            fetchCategories();
        }
    }, [isAdmin]);

    useFocusEffect(
        useCallback(() => {
            if (isAdmin) {
                fetchFoods();
            }
        }, [isAdmin])
    );

    const fetchFoods = async () => {
        try {
            console.log('Fetching foods from:', DATABASE_ID, MENU_COLLECTION_ID);
            const response = await databases.listDocuments(DATABASE_ID, MENU_COLLECTION_ID);
            console.log('Foods fetched:', response.documents.length);
            setFoods(response.documents as unknown as FoodItem[]);
        } catch (error: any) {
            console.error('Error fetching foods:', error);
            Alert.alert('Error', `Failed to fetch foods: ${error.message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await databases.listDocuments(DATABASE_ID, CATEGORIES_COLLECTION_ID);
            setCategories(response.documents as unknown as Category[]);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                setUploadingImage(true);

                const asset = result.assets[0];

                // Convert image to blob
                const response = await fetch(asset.uri);
                const blob = await response.blob();

                // Create unique file ID
                const fileId = ID.unique();

                console.log('Uploading to bucket:', BUCKET_ID);
                console.log('File ID:', fileId);

                // Upload to Appwrite Storage
                const uploadedFile = await storage.createFile(
                    BUCKET_ID,
                    fileId,
                    blob
                );

                console.log('Upload successful:', uploadedFile);

                // Get the image URL
                const imageUrl = `${appwriteConfig.endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${appwriteConfig.projectId}`;

                setForm({ ...form, imageURL: imageUrl });
                Alert.alert('Success', 'Image uploaded successfully');
            }
        } catch (error: any) {
            console.error('Error uploading image:', error);
            Alert.alert('Error', `Failed to upload image: ${error.message}\n\nYou can still add food with a placeholder image.`);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.name || !form.price || !form.category) {
            Alert.alert('Error', 'Please fill in required fields (Name, Price, Category)');
            return;
        }

        const foodData = {
            name: form.name,
            description: form.description || '',
            price: parseFloat(form.price),
            imageURL: form.imageURL || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
            category: form.category,
            rating: 4.0,
            calories: parseInt(form.calories) || 0,
            protein: parseInt(form.protein) || 0
        };

        try {
            if (editingItem) {
                await databases.updateDocument(
                    DATABASE_ID,
                    MENU_COLLECTION_ID,
                    editingItem.$id,
                    foodData
                );
                Alert.alert('Success', 'Food updated successfully');
            } else {
                await databases.createDocument(
                    DATABASE_ID,
                    MENU_COLLECTION_ID,
                    ID.unique(),
                    foodData
                );
                Alert.alert('Success', 'Food added successfully');
            }
            resetForm();
            fetchFoods();
        } catch (error: any) {
            console.error('Error saving food:', error);
            Alert.alert('Error', `Failed to save food: ${error.message}`);
        }
    };

    const handleDelete = (item: FoodItem) => {
        Alert.alert(
            'Delete Food',
            `Are you sure you want to delete "${item.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await databases.deleteDocument(
                                DATABASE_ID,
                                MENU_COLLECTION_ID,
                                item.$id
                            );
                            Alert.alert('Success', 'Food deleted successfully');
                            fetchFoods();
                        } catch (error: any) {
                            console.error('Error deleting food:', error);
                            Alert.alert('Error', `Failed to delete food: ${error.message}`);
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setForm({
            name: '',
            description: '',
            price: '',
            imageURL: '',
            category: '',
            calories: '',
            protein: ''
        });
        setEditingItem(null);
        setModalVisible(false);
    };

    const editFood = (item: FoodItem) => {
        setEditingItem(item);
        setForm({
            name: item.name,
            description: item.description || '',
            price: item.price.toString(),
            imageURL: item.imageURL,
            category: item.category,
            calories: item.calories?.toString() || '',
            protein: item.protein?.toString() || ''
        });
        setModalVisible(true);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchFoods();
    };

    if (!isAdmin) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Text className="text-red-500 text-lg font-bold">Access Denied</Text>
                <Text className="text-gray-500 mt-2">Admin only area</Text>
                <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl mt-5" onPress={() => router.back()}>
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#FE8C00" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="text-xl font-quicksand-bold text-dark-100">Manage Foods</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-primary px-4 py-2 rounded-full">
                    <Text className="text-white font-bold">+ Add</Text>
                </TouchableOpacity>
            </View>

            {/* Food List */}
            <FlatList
                data={foods}
                keyExtractor={(item) => item.$id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={() => (
                    <View className="flex-1 justify-center items-center py-20">
                        <Text className="text-gray-400 text-lg">No foods found</Text>
                        <Text className="text-gray-400 text-sm mt-2">Tap + Add to create your first food item</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <View className="flex-row items-center p-4 border-b border-gray-100">
                        <Image
                            source={{ uri: item.imageURL }}
                            className="w-16 h-16 rounded-xl"
                            resizeMode="cover"
                            onError={() => console.log('Failed to load image:', item.imageURL)}
                        />
                        <View className="flex-1 ml-4">
                            <Text className="font-quicksand-bold text-dark-100 text-lg">{item.name}</Text>
                            <Text className="text-gray-500 text-sm" numberOfLines={1}>
                                {item.description || 'No description'}
                            </Text>
                            <Text className="text-primary font-quicksand-bold mt-1">Ksh {item.price}</Text>
                        </View>
                        <View className="flex-row gap-3">
                            <TouchableOpacity onPress={() => editFood(item)} className="bg-blue-500 p-2 rounded-lg">
                                <Ionicons name="pencil" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item)} className="bg-red-500 p-2 rounded-lg">
                                <Ionicons name="trash" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            />

            {/* Add/Edit Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={resetForm}>
                <View className="flex-1 bg-black/50">
                    <ScrollView className="bg-white m-5 rounded-2xl p-5">
                        <Text className="text-2xl font-quicksand-bold text-dark-100 mb-5">
                            {editingItem ? 'Edit Food' : 'Add New Food'}
                        </Text>

                        {/* Image Upload */}
                        <Text className="font-quicksand-medium text-dark-100 mb-2">Food Image</Text>
                        <TouchableOpacity
                            className="bg-gray-100 p-3 rounded-xl mb-4 items-center border border-gray-300"
                            onPress={pickImage}
                            disabled={uploadingImage}
                        >
                            {uploadingImage ? (
                                <ActivityIndicator size="small" color="#FE8C00" />
                            ) : (
                                <Text className="text-primary font-bold">📸 {form.imageURL ? 'Change Image' : 'Upload Image'}</Text>
                            )}
                        </TouchableOpacity>

                        {form.imageURL ? (
                            <Image source={{ uri: form.imageURL }} className="w-full h-40 rounded-xl mb-4" resizeMode="cover" />
                        ) : (
                            <View className="w-full h-40 rounded-xl mb-4 bg-gray-100 items-center justify-center">
                                <Text className="text-gray-400">No image selected</Text>
                            </View>
                        )}

                        <Text className="font-quicksand-medium text-dark-100 mb-1">Name *</Text>
                        <TextInput
                            className="border border-gray-300 rounded-xl p-3 mb-4"
                            value={form.name}
                            onChangeText={(text) => setForm({ ...form, name: text })}
                            placeholder="e.g., Classic Cheeseburger"
                        />

                        <Text className="font-quicksand-medium text-dark-100 mb-1">Description</Text>
                        <TextInput
                            className="border border-gray-300 rounded-xl p-3 mb-4"
                            value={form.description}
                            onChangeText={(text) => setForm({ ...form, description: text })}
                            placeholder="Describe the food"
                            multiline
                            numberOfLines={3}
                        />

                        <Text className="font-quicksand-medium text-dark-100 mb-1">Price (Ksh) *</Text>
                        <TextInput
                            className="border border-gray-300 rounded-xl p-3 mb-4"
                            value={form.price}
                            onChangeText={(text) => setForm({ ...form, price: text })}
                            placeholder="e.g., 450"
                            keyboardType="numeric"
                        />

                        <Text className="font-quicksand-medium text-dark-100 mb-1">Category *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.$id}
                                    className={`mr-3 px-4 py-2 rounded-full ${form.category === cat.$id ? 'bg-primary' : 'bg-gray-200'}`}
                                    onPress={() => setForm({ ...form, category: cat.$id })}
                                >
                                    <Text className={form.category === cat.$id ? 'text-white' : 'text-dark-100'}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text className="font-quicksand-medium text-dark-100 mb-1">Calories</Text>
                        <TextInput
                            className="border border-gray-300 rounded-xl p-3 mb-4"
                            value={form.calories}
                            onChangeText={(text) => setForm({ ...form, calories: text })}
                            placeholder="e.g., 500"
                            keyboardType="numeric"
                        />

                        <Text className="font-quicksand-medium text-dark-100 mb-1">Protein (g)</Text>
                        <TextInput
                            className="border border-gray-300 rounded-xl p-3 mb-4"
                            value={form.protein}
                            onChangeText={(text) => setForm({ ...form, protein: text })}
                            placeholder="e.g., 25"
                            keyboardType="numeric"
                        />

                        <View className="flex-row gap-3 mt-4 mb-4">
                            <TouchableOpacity className="flex-1 bg-gray-300 py-3 rounded-xl" onPress={resetForm}>
                                <Text className="text-center font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-primary py-3 rounded-xl" onPress={handleSubmit}>
                                <Text className="text-white text-center font-bold">
                                    {editingItem ? 'Update' : 'Add'} Food
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}