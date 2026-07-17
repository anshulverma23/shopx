import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type { ListProductsParams, Order, OrderStatus, Product, ProductListResponse, Seller, SellerDashboard, User } from "./types";
import { getGetProductQueryKey } from "./products";

export interface RegisterSellerInput {
  storeName: string;
  description?: string;
  gstNumber?: string;
}
export interface RegisterSellerResponse extends Seller {
  accessToken: string;
  refreshToken: string;
  user: User;
}
export const registerSeller = (data: RegisterSellerInput) =>
  apiRequest<RegisterSellerResponse>("/sellers/register", { method: "POST", data });
export const useRegisterSeller = () => {
  const queryClient = useQueryClient();
  return useMutation<RegisterSellerResponse, ApiError, { data: RegisterSellerInput }>({
    mutationFn: (vars) => registerSeller(vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "me"] }),
  });
};

export const getSellerProfile = () => apiRequest<Seller>("/sellers/me");
export const getGetSellerProfileQueryKey = () => ["sellers", "me"];
export const useGetSellerProfile = (options?: { query?: { enabled?: boolean; retry?: boolean } }) =>
  useQuery<Seller, ApiError>({
    queryKey: getGetSellerProfileQueryKey(),
    queryFn: getSellerProfile,
    ...options?.query,
  });

export interface UpdateSellerProfileInput {
  storeName?: string;
  description?: string;
  logoUrl?: string;
  gstNumber?: string;
}
export const updateSellerProfile = (data: UpdateSellerProfileInput) =>
  apiRequest<Seller>("/sellers/me", { method: "PATCH", data });
export const useUpdateSellerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation<Seller, ApiError, { data: UpdateSellerProfileInput }>({
    mutationFn: (vars) => updateSellerProfile(vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSellerProfileQueryKey() }),
  });
};

export const getSellerDashboard = () => apiRequest<SellerDashboard>("/sellers/me/dashboard");
export const useGetSellerDashboard = () =>
  useQuery<SellerDashboard, ApiError>({ queryKey: ["sellers", "me", "dashboard"], queryFn: getSellerDashboard });

// ── Seller products ───────────────────────────────────────────────────────
export const listSellerProducts = (params?: ListProductsParams) =>
  apiRequest<ProductListResponse>("/sellers/me/products", { params: params as Record<string, any> });
export const getListSellerProductsQueryKey = (params?: ListProductsParams) => ["sellers", "me", "products", params ?? {}];
export const useListSellerProducts = (params?: ListProductsParams) =>
  useQuery<ProductListResponse, ApiError>({
    queryKey: getListSellerProductsQueryKey(params),
    queryFn: () => listSellerProducts(params),
  });

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  discountPrice?: number | null;
  images?: string[];
  categoryId?: string | null;
  brandId?: string | null;
  stock?: number;
  specifications?: Record<string, string>;
  tags?: string[];
}

export const createProduct = (data: ProductInput) => apiRequest<Product>("/sellers/me/products", { method: "POST", data });
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<Product, ApiError, { data: ProductInput }>({
    mutationFn: (vars) => createProduct(vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers", "me", "products"] }),
  });
};

export const updateProduct = (id: string, data: Partial<ProductInput>) =>
  apiRequest<Product>(`/sellers/me/products/${id}`, { method: "PATCH", data });
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<Product, ApiError, { id: string; data: Partial<ProductInput> }>({
    mutationFn: (vars) => updateProduct(vars.id, vars.data),
    onSuccess: (_result, vars) => {
      queryClient.invalidateQueries({ queryKey: ["sellers", "me", "products"] });
      queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(vars.id) });
    },
  });
};

export const deleteProduct = (id: string) =>
  apiRequest<{ message: string }>(`/sellers/me/products/${id}`, { method: "DELETE" });
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { id: string }>({
    mutationFn: (vars) => deleteProduct(vars.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers", "me", "products"] }),
  });
};

// ── Seller orders ─────────────────────────────────────────────────────────
export interface ListSellerOrdersParams {
  status?: OrderStatus;
}
export const listSellerOrders = (params?: ListSellerOrdersParams) =>
  apiRequest<Order[]>("/sellers/me/orders", { params: params as Record<string, any> });
export const getListSellerOrdersQueryKey = (params?: ListSellerOrdersParams) => ["sellers", "me", "orders", params ?? {}];
export const useListSellerOrders = (params?: ListSellerOrdersParams) =>
  useQuery<Order[], ApiError>({
    queryKey: getListSellerOrdersQueryKey(params),
    queryFn: () => listSellerOrders(params),
  });

export const updateOrderStatus = (id: string, data: { status?: OrderStatus; trackingNumber?: string }) =>
  apiRequest<Order>(`/sellers/me/orders/${id}/status`, { method: "PATCH", data });
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, ApiError, { id: string; data: { status?: OrderStatus; trackingNumber?: string } }>({
    mutationFn: (vars) => updateOrderStatus(vars.id, vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sellers", "me", "orders"] }),
  });
};
