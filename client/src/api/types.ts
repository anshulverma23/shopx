// Shared types returned by the ShopX API. Mirrors the shapes returned by
// the Express/MongoDB backend in server/src/routes/*.

export type UserRole = "buyer" | "seller" | "admin";
export type UserStatus = "active" | "banned";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  status: UserStatus;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export type ProductStatus = "pending" | "approved" | "rejected";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountPrice: number | null;
  discountPercent: number | null;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  categoryId: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  sellerId: string | null;
  sellerName: string | null;
  status: ProductStatus | "featured";
  isFeatured: boolean;
  createdAt: string;
}

export interface ProductDetail extends Product {
  specifications: Record<string, string>;
  tags: string[];
  seller: { id: string; storeName: string; rating: number; totalProducts: number } | null;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ListProductsParams {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "rating" | "popular";
  page?: number;
  limit?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productCount: number;
  parent: string | null;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  discountPrice: number | null;
  quantity: number;
  images: string[];
  stock: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  couponCode: string | null;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";
export type PaymentMethod = "cod" | "razorpay";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  sellerId: string | null;
}

export interface OrderAddress {
  id?: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  total: number;
  address: OrderAddress;
  couponCode: string | null;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayCheckoutDetails {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface CreateOrderResponse extends Order {
  razorpay?: RazorpayCheckoutDetails;
}

export type SellerStatus = "pending" | "approved" | "rejected" | "suspended";

export interface Seller {
  id: string;
  userId: string;
  storeName: string;
  description: string | null;
  logoUrl: string | null;
  status: SellerStatus;
  totalProducts: number;
  totalSales: number;
  rating: number;
  gstNumber: string | null;
  createdAt: string;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface SellerDashboard {
  totalSales: number;
  todaySales: number;
  monthlySales: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalProducts: number;
  topProducts: Array<{ id: string; name: string; imageUrl: string | null; sales: number; revenue: number }>;
  revenueChart: RevenuePoint[];
}

export interface AdminDashboard {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
  revenueChart: RevenuePoint[];
  categoryBreakdown: Array<{ name: string; count: number }>;
}

export type DiscountType = "percent" | "flat";

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrder: number | null;
  maxDiscount: number | null;
  isActive: boolean;
  expiresAt: string | null;
}

export interface AdminUsersResponse {
  users: User[];
  total: number;
  page: number;
}
