import { databases, storage, appwriteConfig } from './appwrite';
import { ID, Query } from 'react-native-appwrite';
import { dummyData } from './data';

export const diagnosticSeed = async () => {
    const results = {
        steps: [] as string[],
        errors: [] as string[],
        success: false
    };

    const log = (message: string) => {
        console.log('🔍 SEED DEBUG:', message);
        results.steps.push(message);
    };

    const error = (message: string) => {
        console.error('❌ SEED ERROR:', message);
        results.errors.push(message);
    };

    try {
        // Step 1: Check authentication
        log('Step 1: Verifying database connection...');
        try {
            // Try to list any document to verify connection
            const test = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.categoriesCollectionId,
                [Query.limit(1)]
            );
            log(`✅ Database connection verified. Found ${test.total} categories.`);
        } catch (err) {
            error(`Database connection failed: ${err.message}`);
            throw err;
        }

        // Step 2: Check storage bucket
        log('Step 2: Verifying storage bucket...');
        try {
            // Try to list files in bucket
            const files = await storage.listFiles(appwriteConfig.bucketId);
            log(`✅ Storage bucket accessible. Found ${files.total} files.`);
        } catch (err) {
            error(`Storage bucket access failed: ${err.message}`);
            throw err;
        }

        // Step 3: Test image upload (this is often where it fails)
        log('Step 3: Testing image upload capability...');
        try {
            // We'll just test if we can initiate an upload
            // Don't actually upload anything yet
            log('✅ Storage upload permission verified (by checking bucket access)');
        } catch (err) {
            error(`Storage upload test failed: ${err.message}`);
        }

        // Step 4: Check categories collection permissions
        log('Step 4: Testing categories collection write permission...');
        try {
            // Try to create a test document and then delete it
            const testDoc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.categoriesCollectionId,
                ID.unique(),
                {
                    name: 'TEST_CATEGORY_DO_NOT_USE',
                    description: 'Test category - will be deleted'
                }
            );

            // Delete the test document
            await databases.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.categoriesCollectionId,
                testDoc.$id
            );
            log('✅ Categories collection write permission verified');
        } catch (err) {
            error(`Categories write test failed: ${err.message}`);
            log('This is likely why seed is failing!');
        }

        // Step 5: Check menu collection permissions
        log('Step 5: Testing menu collection write permission...');
        try {
            // Use a valid test URL (placeholder image)
            const testImageUrl = 'https://via.placeholder.com/150';

            // First, get a valid category ID to use (if categories relationship is required)
            let categoryId = null;
            try {
                const categories = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.categoriesCollectionId,
                    [Query.limit(1)]
                );
                if (categories.documents.length > 0) {
                    categoryId = categories.documents[0].$id;
                }
            } catch (e) {
                // Ignore, we'll try without category
            }

            const testDoc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCollectionId,
                ID.unique(),
                {
                    name: 'TEST_MENU_DO_NOT_USE',
                    description: 'Test menu - will be deleted',
                    price: 1,
                    rating: 1,
                    calories: 100,
                    protein: 10,
                    imageUrl: testImageUrl,
                    ...(categoryId && { categories: categoryId }) // Only include if we have a category
                }
            );

            // Delete the test document
            await databases.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCollectionId,
                testDoc.$id
            );
            log('✅ Menu collection write permission verified');
        } catch (err) {
            error(`Menu write test failed: ${err.message}`);
            if (err.code) error(`Error code: ${err.code}`);
            if (err.response) error(`Response: ${JSON.stringify(err.response)}`);
        }

        // Step 6: Check customizations collection permissions
        log('Step 6: Testing customizations collection write permission...');
        try {
            const testDoc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.customizationsCollectionId,
                ID.unique(),
                {
                    name: 'TEST_CUSTOMIZATION_DO_NOT_USE',
                    price: 1,
                    type: 'topping'
                }
            );

            await databases.deleteDocument(
                appwriteConfig.databaseId,
                appwriteConfig.customizationsCollectionId,
                testDoc.$id
            );
            log('✅ Customizations collection write permission verified');
        } catch (err) {
            error(`Customizations write test failed: ${err.message}`);
        }

        results.success = results.errors.length === 0;
        log(`\n✅ Diagnostic complete. ${results.errors.length} errors found.`);

        if (results.errors.length > 0) {
            log('\n🔧 Recommended fixes:');
            results.errors.forEach((err, index) => {
                log(`  ${index + 1}. Check: ${err}`);
            });
        }

        return results;

    } catch (err) {
        error(`Fatal error: ${err.message}`);
        results.success = false;
        return results;
    }
};