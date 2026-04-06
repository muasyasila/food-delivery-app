import {Account, Avatars, Client, Databases, ID, Query, Storage} from "react-native-appwrite";
import {CreateUserParams, GetMenuParams, MenuItem, SignInParams} from "@/type";

export const appwriteConfig = {
    endpoint: 'https://fra.cloud.appwrite.io/v1',
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '6998750d0019abde43c1',
    platform: "com.jsm.foodordering",
    databaseId: '6998751f00212218bdb9',
    bucketId: '6998b23e002d01693302',
    userCollectionId: 'user',
    categoriesCollectionId: 'categories',
    menuCollectionId: 'menu',
    customizationsCollectionId: 'customizations',
    menuCustomizationsCollectionId: 'menu_customizations',
    // ADD THIS - Replace with your actual orders collection ID from Appwrite
    ordersCollectionId: 'orders'  // <-- YOU NEED TO ADD YOUR ID HERE
}

export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

export const createUser = async ({ email, password, name }: CreateUserParams) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name)
        if(!newAccount) throw Error;

        await signIn({ email, password });

        const avatarUrl = avatars.getInitialsURL(name);

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            { email, name, accountId: newAccount.$id, avatar: avatarUrl }
        );
    } catch (e) {
        throw new Error(e as string);
    }
}

export const signIn = async ({ email, password }: SignInParams) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (e) {
        throw new Error(e as string);
    }
}

export const signOut = async () => {
    try {
        await account.deleteSession('current');
    } catch (e) {
        console.log('Sign out error:', e);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if(!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (e) {
        console.log(e);
        throw new Error(e as string);
    }
}

export const getMenu = async ({ category, query }: GetMenuParams) => {
    try {
        const queries: string[] = [];

        if(category) queries.push(Query.equal('categories', category));
        if(query) queries.push(Query.search('name', query));

        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries,
        )

        return menus.documents;
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getCategories = async () => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
        )

        return categories.documents;
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getMenuById = async (id: string) => {
    try {
        const menuItem = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            id
        );
        return menuItem as MenuItem;
    } catch (error) {
        console.error('Error fetching menu item:', error);
        throw error;
    }
};

// Storage test function
export const testStorage = async () => {
    try {
        const files = await storage.listFiles(appwriteConfig.bucketId);
        console.log('Storage files:', files);
        return files;
    } catch (error) {
        console.error('Storage error:', error);
        throw error;
    }
};

// ============================================
// 🆕 ORDER FUNCTIONS - ADDED BELOW
// ============================================

// Function to create a new order from cart
export const createOrder = async (
    userId: string,
    userName: string,
    userEmail: string,
    items: any[],
    totalAmount: number,
    deliveryAddress: string
) => {
    try {
        const order = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            ID.unique(),
            {
                userId,
                userName,
                userEmail,
                items: JSON.stringify(items), // Convert cart items to JSON string
                totalAmount,
                status: 'pending',
                deliveryAddress,
                orderDate: new Date().toISOString(),
            }
        );
        return order;
    } catch (error) {
        console.error('Error creating order:', error);
        throw new Error(error as string);
    }
};

// Function to get orders with filters (for admin dashboard)
export const getOrders = async (filters?: {
    month?: number;
    year?: number;
    status?: string;
    limit?: number;
}) => {
    try {
        const queries: string[] = [];

        // Add date filter if month and year provided
        if (filters?.month !== undefined && filters?.year !== undefined) {
            const startDate = new Date(filters.year, filters.month - 1, 1);
            const endDate = new Date(filters.year, filters.month, 0);

            queries.push(
                Query.greaterThanEqual('orderDate', startDate.toISOString()),
                Query.lessThanEqual('orderDate', endDate.toISOString())
            );
        }

        // Add status filter if provided
        if (filters?.status && filters.status !== 'all') {
            queries.push(Query.equal('status', filters.status));
        }

        // Order by most recent first
        queries.push(Query.orderDesc('orderDate'));

        // Add limit if provided
        if (filters?.limit) {
            queries.push(Query.limit(filters.limit));
        }

        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            queries
        );

        return response.documents;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw new Error(error as string);
    }
};

// Function to update order status (for admin)
export const updateOrderStatus = async (orderId: string, status: string) => {
    try {
        const order = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            orderId,
            { status }
        );
        return order;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw new Error(error as string);
    }
};

// Function to get a single order by ID
export const getOrderById = async (orderId: string) => {
    try {
        const order = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            orderId
        );
        return order;
    } catch (error) {
        console.error('Error fetching order:', error);
        throw new Error(error as string);
    }
};

// Function to get user's orders (for customer to see their order history)
export const getUserOrders = async (userId: string) => {
    try {
        const orders = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            [
                Query.equal('userId', userId),
                Query.orderDesc('orderDate')
            ]
        );
        return orders.documents;
    } catch (error) {
        console.error('Error fetching user orders:', error);
        throw new Error(error as string);
    }
};

// Function to get order statistics (for admin dashboard)
export const getOrderStats = async (month?: number, year?: number) => {
    try {
        const queries: string[] = [];

        if (month !== undefined && year !== undefined) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            queries.push(
                Query.greaterThanEqual('orderDate', startDate.toISOString()),
                Query.lessThanEqual('orderDate', endDate.toISOString())
            );
        }

        const orders = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.ordersCollectionId,
            queries
        );

        const totalOrders = orders.documents.length;
        const totalRevenue = orders.documents.reduce((sum, order) => sum + order.totalAmount, 0);
        const pendingOrders = orders.documents.filter(o => o.status === 'pending').length;
        const confirmedOrders = orders.documents.filter(o => o.status === 'confirmed').length;
        const deliveredOrders = orders.documents.filter(o => o.status === 'delivered').length;

        return {
            totalOrders,
            totalRevenue,
            pendingOrders,
            confirmedOrders,
            deliveredOrders,
            orders: orders.documents
        };
    } catch (error) {
        console.error('Error fetching order stats:', error);
        throw new Error(error as string);
    }
};

// Export ID and Query for use in other files
export { ID, Query };