import { Models } from "react-native-appwrite";

export interface MenuItem extends Models.Document {
    name: string;
    price: number;
    image_url: string;
    description: string;
    calories: number;
    protein: number;
    rating: number;
    type: string;
}

export interface Category extends Models.Document {
    name: string;
    description: string;
}

export interface User extends Models.Document {
    name: string;
    email: string;
    avatar: string;
}

export interface CartCustomization {
    id: string;
    name: string;
    price: number;
    type: string;
}

export interface CartItemType {
    id: string; // menu item id
    name: string;
    price: number;
    imageUrl?: string;
    image_url: string;
    quantity: number;
    customizations?: CartCustomization[];
}

export interface CartStore {
    items: CartItemType[];
    addItem: (item: Omit<CartItemType, "quantity">) => void;
    removeItem: (id: string, customizations: CartCustomization[]) => void;
    increaseQty: (id: string, customizations: CartCustomization[]) => void;
    decreaseQty: (id: string, customizations: CartCustomization[]) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

interface TabBarIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
    title: string;
}

interface PaymentInfoStripeProps {
    label: string;
    value: string;
    labelStyle?: string;
    valueStyle?: string;
}

interface CustomButtonProps {
    onPress?: () => void;
    title?: string;
    style?: string;
    leftIcon?: React.ReactNode;
    textStyle?: string;
    isLoading?: boolean;
}

interface CustomHeaderProps {
    title?: string;
}

interface CustomInputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    label: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: ImageSourcePropType;
}

interface CreateUserPrams {
    email: string;
    password: string;
    name: string;
}

interface SignInParams {
    email: string;
    password: string;
}

interface GetMenuParams {
    category: string;
    query: string;
}

// ============================================
// 🆕 ORDER RELATED TYPES - ADDED BELOW
// ============================================

// Order interface - matches the orders collection in Appwrite
export interface Order extends Models.Document {
    userId: string;           // User's account ID from Appwrite auth
    userName: string;         // Customer's full name
    userEmail: string;        // Customer's email address
    items: string;            // JSON string of cart items (parse with JSON.parse)
    totalAmount: number;      // Total order amount
    status: 'pending' | 'confirmed' | 'delivered';  // Order status
    deliveryAddress: string;  // Where to deliver the order
    orderDate: string;        // ISO string of when order was placed
}

// Parameters for creating a new order
export interface CreateOrderParams {
    userId: string;
    userName: string;
    userEmail: string;
    items: CartItemType[];    // Array of cart items (will be stringified)
    totalAmount: number;
    deliveryAddress: string;
}

// Parameters for filtering orders (admin dashboard)
export interface GetOrdersFilters {
    month?: number;      // 1-12
    year?: number;       // e.g., 2024, 2025
    status?: string;     // 'pending', 'confirmed', 'delivered', or 'all'
    limit?: number;      // Max number of orders to return
}

// Order statistics for admin dashboard
export interface OrderStats {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    confirmedOrders: number;
    deliveredOrders: number;
    orders: Order[];
}

// Monthly sales report data
export interface MonthlyReport {
    month: number;
    year: number;
    totalOrders: number;
    totalRevenue: number;
    orders: Order[];
}

// Order item display (when parsing the items JSON string)
export interface ParsedOrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    customizations?: CartCustomization[];
}

// Checkout form data
export interface CheckoutFormData {
    deliveryAddress: string;
    paymentMethod?: string;
    specialInstructions?: string;
}

// Update order status parameters
export interface UpdateOrderStatusParams {
    orderId: string;
    status: 'pending' | 'confirmed' | 'delivered';
}