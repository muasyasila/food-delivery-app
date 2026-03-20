import { Text, TouchableOpacity, Image, Platform, View } from 'react-native';
import { MenuItem } from "@/type";
import { appwriteConfig } from "@/lib/appwrite";
import { useCartStore } from "@/store/cart.store";
import { useState, useEffect } from 'react';
import { router } from 'expo-router';

const MenuCard = ({ item }: { item: MenuItem }) => {
    const [imageError, setImageError] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { addItem } = useCartStore();

    useEffect(() => {
        // Debug: Log the entire item to see what we're getting
        console.log('MenuCard - Full item:', JSON.stringify(item, null, 2));

        // Check if item exists
        if (!item) {
            console.log('No item provided');
            setImageError(true);
            setIsLoading(false);
            return;
        }

        // Check which image field exists
        let url = '';
        if (item?.imageUrl) {
            console.log('Found imageUrl (camelCase):', item.imageUrl);
            url = item.imageUrl;
        } else if (item?.image_url) {
            console.log('Found image_url (snake_case):', item.image_url);
            url = item.image_url;
        } else {
            console.log('No image field found in item');
            setImageError(true);
            setIsLoading(false);
            return;
        }

        // Add project ID if not present (with null check)
        if (url && typeof url === 'string' && !url.includes('project=')) {
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}project=${appwriteConfig.projectId}`;
        }

        console.log('Final image URL:', url);
        setImageUrl(url || '');
        setIsLoading(false);
    }, [item]);

    const handleImageError = (error: any) => {
        console.log('❌ Image failed to load:', {
            url: imageUrl,
            error: error?.nativeEvent?.error || error || 'Unknown error'
        });
        setImageError(true);
    };

    const handleImageLoad = () => {
        console.log('✅ Image loaded successfully:', imageUrl);
        setImageError(false);
    };

    const handleAddToCart = () => {
        if (!item || !item.$id) return;

        addItem({
            id: item.$id,
            name: item.name || 'Unknown Item',
            price: item.price || 0,
            image_url: imageUrl || '',
            customizations: []
        });
    };

    const handleCardPress = () => {
        if (!item || !item.$id) return;

        router.push({
            pathname: "/item/[id]",
            params: { id: item.$id }
        });
    };

    if (isLoading) {
        return (
            <TouchableOpacity
                className="menu-card"
                style={Platform.OS === 'android' ? { elevation: 10, shadowColor: '#878787' } : {}}
                onPress={handleCardPress}
                disabled={!item}
            >
                <View className="size-32 absolute -top-10 bg-gray-200 rounded-lg items-center justify-center">
                    <Text className="text-xs text-gray-500">Loading...</Text>
                </View>
                <Text className="text-center base-bold text-dark-100 mb-2" numberOfLines={1}>
                    {item?.name || 'Loading...'}
                </Text>
                <Text className="body-regular text-gray-200 mb-4">
                    Ksh {item?.price?.toString() || '0'}
                </Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            className="menu-card"
            style={Platform.OS === 'android' ? { elevation: 10, shadowColor: '#878787' } : {}}
            onPress={handleCardPress}
            disabled={!item}
        >
            {!imageError && imageUrl ? (
                <Image
                    source={{ uri: imageUrl }}
                    className="size-32 absolute -top-10"
                    resizeMode="contain"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                />
            ) : (
                <View className="size-32 absolute -top-10 bg-gray-200 rounded-lg items-center justify-center">
                    <Text className="text-xs text-gray-500">🍔</Text>
                </View>
            )}

            <Text className="text-center base-bold text-dark-100 mb-2" numberOfLines={1}>
                {item?.name || 'Unknown Item'}
            </Text>

            <Text className="body-regular text-gray-200 mb-4">
                Ksh {item?.price?.toString() || '0'}
            </Text>

            <TouchableOpacity onPress={handleAddToCart}>
                <Text className="paragraph-bold text-primary">Add to Cart +</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

export default MenuCard;