import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";

interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: "topping" | "side" | "size" | "crust" | string; // extend as needed
}

interface MenuItem {
    name: string;
    description: string;
    image_url: string;
    price: number;
    rating: number;
    calories: number;
    protein: number;
    category_name: string;
    customizations: string[]; // list of customization names
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

// ensure dummyData has correct shape
const data = dummyData as DummyData;

async function clearAll(collectionId: string): Promise<void> {
    console.log(`Clearing collection: ${collectionId}`);
    const list = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId
    );

    await Promise.all(
        list.documents.map((doc) =>
            databases.deleteDocument(appwriteConfig.databaseId, collectionId, doc.$id)
        )
    );
    console.log(`✅ Cleared ${list.documents.length} documents from collection`);
}

async function clearStorage(): Promise<void> {
    console.log('Clearing storage bucket...');
    const list = await storage.listFiles(appwriteConfig.bucketId);

    await Promise.all(
        list.files.map((file) =>
            storage.deleteFile(appwriteConfig.bucketId, file.$id)
        )
    );
    console.log(`✅ Cleared ${list.files.length} files from storage`);
}

async function uploadImageToStorage(imageUrl: string) {
    console.log('📤 Uploading image from:', imageUrl);

    try {
        // Step 1: Fetch the image
        console.log('Fetching image...');
        const response = await fetch(imageUrl);
        console.log('✅ Fetch response status:', response.status);

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const blob = await response.blob();
        console.log('✅ Blob created, size:', blob.size, 'type:', blob.type);

        const fileObj = {
            name: imageUrl.split("/").pop() || `file-${Date.now()}.jpg`,
            type: blob.type,
            size: blob.size,
            uri: imageUrl,
        };
        console.log('📁 File object prepared:', fileObj.name);

        // Step 2: Upload to Appwrite storage
        console.log('⏫ Uploading to Appwrite storage...');
        const file = await storage.createFile(
            appwriteConfig.bucketId,
            ID.unique(),
            fileObj
        );
        console.log('✅ File uploaded to Appwrite, file ID:', file.$id);

        // Step 3: Get the view URL
        const viewUrl = storage.getFileViewURL(appwriteConfig.bucketId, file.$id);
        console.log('🔗 Raw view URL:', viewUrl);

        // Step 4: Ensure it's a proper URL
        try {
            new URL(viewUrl);
            console.log('✅ URL is valid format');
            return viewUrl;
        } catch (e) {
            console.log('❌ URL is invalid format:', e.message);
            // Try to encode it
            const encodedUrl = encodeURI(viewUrl);
            console.log('🔧 Encoded URL:', encodedUrl);

            // Test encoded URL
            try {
                new URL(encodedUrl);
                console.log('✅ Encoded URL is valid');
                return encodedUrl;
            } catch (e2) {
                console.log('❌ Encoded URL also invalid:', e2.message);
                throw new Error('Could not create valid URL from Appwrite response');
            }
        }

    } catch (error) {
        console.error('❌ Error in uploadImageToStorage:', error);
        throw error;
    }
}

async function seed(): Promise<void> {
    console.log('🌱 Starting seed process...');

    try {
        // 1. Clear all
        console.log('\n📋 Step 1: Clearing existing data...');
        await clearAll(appwriteConfig.categoriesCollectionId);
        await clearAll(appwriteConfig.customizationsCollectionId);
        await clearAll(appwriteConfig.menuCollectionId);
        await clearAll(appwriteConfig.menuCustomizationsCollectionId);
        await clearStorage();

        // 2. Create Categories
        console.log('\n📋 Step 2: Creating categories...');
        const categoryMap: Record<string, string> = {};
        for (const cat of data.categories) {
            console.log(`Creating category: ${cat.name}`);
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.categoriesCollectionId,
                ID.unique(),
                cat
            );
            categoryMap[cat.name] = doc.$id;
            console.log(`✅ Created category: ${cat.name} with ID: ${doc.$id}`);
        }

        // 3. Create Customizations
        console.log('\n📋 Step 3: Creating customizations...');
        const customizationMap: Record<string, string> = {};
        for (const cus of data.customizations) {
            console.log(`Creating customization: ${cus.name}`);
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.customizationsCollectionId,
                ID.unique(),
                {
                    name: cus.name,
                    price: cus.price,
                    type: cus.type,
                }
            );
            customizationMap[cus.name] = doc.$id;
            console.log(`✅ Created customization: ${cus.name}`);
        }

        // 4. Create Menu Items
        console.log('\n📋 Step 4: Creating menu items...');
        const menuMap: Record<string, string> = {};

        for (const item of data.menu) {
            console.log(`\n🔄 Processing menu item: ${item.name}`);

            let uploadedImage;
            try {
                uploadedImage = await uploadImageToStorage(item.image_url);
                console.log('✅ Using uploaded image');
            } catch (error) {
                console.log('⚠️ Upload failed, using original URL as fallback');
                uploadedImage = item.image_url; // Fallback to original URL
                console.log('Original URL:', uploadedImage);
            }

            console.log('📸 Final image URL being saved:', uploadedImage);

            try {
                const doc = await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.menuCollectionId,
                    ID.unique(),
                    {
                        name: item.name,
                        description: item.description,
                        imageUrl: uploadedImage,
                        price: item.price,
                        rating: item.rating,
                        calories: item.calories,
                        protein: item.protein,
                        categories: categoryMap[item.category_name],
                    }
                );

                menuMap[item.name] = doc.$id;
                console.log(`✅ Created menu item: ${item.name} with ID: ${doc.$id}`);

                // 5. Create menu_customizations
                console.log(`   Adding customizations for ${item.name}...`);
                for (const cusName of item.customizations) {
                    await databases.createDocument(
                        appwriteConfig.databaseId,
                        appwriteConfig.menuCustomizationsCollectionId,
                        ID.unique(),
                        {
                            menu: doc.$id,
                            customizations: customizationMap[cusName],
                        }
                    );
                    console.log(`   ✅ Added customization: ${cusName}`);
                }

            } catch (error) {
                console.error(`❌ Failed to create menu item ${item.name}:`, error);
                if (error.code) console.error('Error code:', error.code);
                if (error.response) console.error('Response:', error.response);
                throw error; // Stop on first error so we can see it
            }
        }

        console.log('\n✅✅✅ Seeding complete successfully! ✅✅✅');

    } catch (error) {
        console.error('\n❌❌❌ SEED FAILED:', error);
        throw error;
    }
}

export default seed;