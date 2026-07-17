import { useQuery } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type { ListProductsParams, Product, ProductDetail, ProductListResponse } from "./types";

export const listProducts = (params?: ListProductsParams) =>
  apiRequest<ProductListResponse>("/products", { params: params as Record<string, any> });
export const getListProductsQueryKey = (params?: ListProductsParams) => ["products", "list", params ?? {}];
export const useListProducts = (
  params?: ListProductsParams,
  options?: { query?: { enabled?: boolean } },
) =>
  useQuery<ProductListResponse, ApiError>({
    queryKey: getListProductsQueryKey(params),
    queryFn: () => listProducts(params),
    ...options?.query,
  });

export const getFeaturedProducts = () => apiRequest<Product[]>("/products/featured");
export const useGetFeaturedProducts = () =>
  useQuery<Product[], ApiError>({ queryKey: ["products", "featured"], queryFn: getFeaturedProducts });

export const getTrendingProducts = () => apiRequest<Product[]>("/products/trending");
export const useGetTrendingProducts = () =>
  useQuery<Product[], ApiError>({ queryKey: ["products", "trending"], queryFn: getTrendingProducts });

export const getProduct = (id: string) => apiRequest<ProductDetail>(`/products/${id}`);
export const getGetProductQueryKey = (id?: string) => ["products", "detail", id];
export const useGetProduct = (id?: string, options?: { query?: { enabled?: boolean } }) =>
  useQuery<ProductDetail, ApiError>({
    queryKey: getGetProductQueryKey(id),
    queryFn: () => getProduct(id as string),
    ...options?.query,
  });

export const getRelatedProducts = (id: string) => apiRequest<Product[]>(`/products/${id}/related`);
export const useGetRelatedProducts = (id?: string, options?: { query?: { enabled?: boolean } }) =>
  useQuery<Product[], ApiError>({
    queryKey: ["products", "related", id],
    queryFn: () => getRelatedProducts(id as string),
    ...options?.query,
  });
