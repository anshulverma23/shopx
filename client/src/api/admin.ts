import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type {
  AdminDashboard,
  AdminUsersResponse,
  Brand,
  Category,
  Coupon,
  DiscountType,
  Order,
  OrderStatus,
  ProductListResponse,
  ProductStatus,
  RevenuePoint,
  Seller,
  SellerStatus,
  UserStatus,
} from "./types";

export const getAdminDashboard = () => apiRequest<AdminDashboard>("/admin/dashboard");
export const useGetAdminDashboard = () =>
  useQuery<AdminDashboard, ApiError>({ queryKey: ["admin", "dashboard"], queryFn: getAdminDashboard });

// ── Users ─────────────────────────────────────────────────────────────────
export interface AdminListUsersParams {
  q?: string;
  status?: UserStatus;
  role?: "buyer" | "seller" | "admin";
  page?: number;
}
export const adminListUsers = (params?: AdminListUsersParams) =>
  apiRequest<AdminUsersResponse>("/admin/users", { params: params as Record<string, any> });
export const getAdminListUsersQueryKey = (params?: AdminListUsersParams) => ["admin", "users", params ?? {}];
export const useAdminListUsers = (params?: AdminListUsersParams) =>
  useQuery<AdminUsersResponse, ApiError>({
    queryKey: getAdminListUsersQueryKey(params),
    queryFn: () => adminListUsers(params),
  });

export const adminUpdateUserStatus = (id: string, status: UserStatus) =>
  apiRequest<{ message: string }>(`/admin/users/${id}/status`, { method: "PATCH", data: { status } });
export const useAdminUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { id: string; data: { status: UserStatus } }>({
    mutationFn: (vars) => adminUpdateUserStatus(vars.id, vars.data.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

// ── Sellers ───────────────────────────────────────────────────────────────
export interface AdminListSellersParams {
  status?: SellerStatus;
}
export const adminListSellers = (params?: AdminListSellersParams) =>
  apiRequest<Seller[]>("/admin/sellers", { params: params as Record<string, any> });
export const getAdminListSellersQueryKey = (params?: AdminListSellersParams) => ["admin", "sellers", params ?? {}];
export const useAdminListSellers = (params?: AdminListSellersParams) =>
  useQuery<Seller[], ApiError>({
    queryKey: getAdminListSellersQueryKey(params),
    queryFn: () => adminListSellers(params),
  });

export const adminUpdateSellerStatus = (id: string, status: SellerStatus) =>
  apiRequest<{ message: string }>(`/admin/sellers/${id}/status`, { method: "PATCH", data: { status } });
export const useAdminUpdateSellerStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { id: string; data: { status: SellerStatus } }>({
    mutationFn: (vars) => adminUpdateSellerStatus(vars.id, vars.data.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] }),
  });
};

// ── Products ──────────────────────────────────────────────────────────────
export interface AdminListProductsParams {
  q?: string;
  status?: ProductStatus;
  page?: number;
}
export const adminListProducts = (params?: AdminListProductsParams) =>
  apiRequest<ProductListResponse>("/admin/products", { params: params as Record<string, any> });
export const getAdminListProductsQueryKey = (params?: AdminListProductsParams) => ["admin", "products", params ?? {}];
export const useAdminListProducts = (params?: AdminListProductsParams) =>
  useQuery<ProductListResponse, ApiError>({
    queryKey: getAdminListProductsQueryKey(params),
    queryFn: () => adminListProducts(params),
  });

export const adminUpdateProductStatus = (id: string, status: string) =>
  apiRequest<{ message: string }>(`/admin/products/${id}/status`, { method: "PATCH", data: { status } });
export const useAdminUpdateProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { id: string; data: { status: string } }>({
    mutationFn: (vars) => adminUpdateProductStatus(vars.id, vars.data.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
  });
};

// ── Orders ────────────────────────────────────────────────────────────────
export interface AdminListOrdersParams {
  status?: OrderStatus;
}
export const adminListOrders = (params?: AdminListOrdersParams) =>
  apiRequest<Order[]>("/admin/orders", { params: params as Record<string, any> });
export const getAdminListOrdersQueryKey = (params?: AdminListOrdersParams) => ["admin", "orders", params ?? {}];
export const useAdminListOrders = (params?: AdminListOrdersParams) =>
  useQuery<Order[], ApiError>({
    queryKey: getAdminListOrdersQueryKey(params),
    queryFn: () => adminListOrders(params),
  });

// ── Categories ────────────────────────────────────────────────────────────
export const adminListCategories = () => apiRequest<Category[]>("/admin/categories");
export const getAdminListCategoriesQueryKey = () => ["admin", "categories"];
export const useAdminListCategories = () =>
  useQuery<Category[], ApiError>({ queryKey: getAdminListCategoriesQueryKey(), queryFn: adminListCategories });

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parent?: string | null;
}
export const adminCreateCategory = (data: CategoryInput) =>
  apiRequest<Category>("/admin/categories", { method: "POST", data });
export const useAdminCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<Category, ApiError, { data: CategoryInput }>({
    mutationFn: (vars) => adminCreateCategory(vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() }),
  });
};

export const adminUpdateCategory = (id: string, data: Partial<CategoryInput>) =>
  apiRequest<Category>(`/admin/categories/${id}`, { method: "PATCH", data });
export const useAdminUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<Category, ApiError, { id: string; data: Partial<CategoryInput> }>({
    mutationFn: (vars) => adminUpdateCategory(vars.id, vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() }),
  });
};

export const adminDeleteCategory = (id: string) =>
  apiRequest<{ message: string }>(`/admin/categories/${id}`, { method: "DELETE" });
export const useAdminDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { id: string }>({
    mutationFn: (vars) => adminDeleteCategory(vars.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() }),
  });
};

// ── Brands ────────────────────────────────────────────────────────────────
export interface BrandInput {
  name: string;
  slug: string;
  logoUrl?: string;
}
export const adminCreateBrand = (data: BrandInput) => apiRequest<Brand>("/admin/brands", { method: "POST", data });
export const useAdminCreateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation<Brand, ApiError, { data: BrandInput }>({
    mutationFn: (vars) => adminCreateBrand(vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands", "list"] }),
  });
};

// ── Coupons ───────────────────────────────────────────────────────────────
export const adminListCoupons = () => apiRequest<Coupon[]>("/admin/coupons");
export const getAdminListCouponsQueryKey = () => ["admin", "coupons"];
export const useAdminListCoupons = () =>
  useQuery<Coupon[], ApiError>({ queryKey: getAdminListCouponsQueryKey(), queryFn: adminListCoupons });

export interface CouponInput {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrder?: number;
  maxDiscount?: number;
  expiresAt?: string;
}
export const adminCreateCoupon = (data: CouponInput) => apiRequest<Coupon>("/admin/coupons", { method: "POST", data });
export const useAdminCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation<Coupon, ApiError, { data: CouponInput }>({
    mutationFn: (vars) => adminCreateCoupon(vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListCouponsQueryKey() }),
  });
};

// ── Analytics ─────────────────────────────────────────────────────────────
export const getRevenueAnalytics = () => apiRequest<RevenuePoint[]>("/admin/analytics/revenue");
export const useGetRevenueAnalytics = () =>
  useQuery<RevenuePoint[], ApiError>({ queryKey: ["admin", "analytics", "revenue"], queryFn: getRevenueAnalytics });
