import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type { Cart } from "./types";

export const getCart = () => apiRequest<Cart>("/cart");
export const getGetCartQueryKey = () => ["cart"];
export const useGetCart = (options?: { query?: { enabled?: boolean } }) =>
  useQuery<Cart, ApiError>({ queryKey: getGetCartQueryKey(), queryFn: getCart, ...options?.query });

export const addToCart = (data: { productId: string; quantity: number }) =>
  apiRequest<Cart>("/cart/items", { method: "POST", data });
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation<Cart, ApiError, { data: { productId: string; quantity: number } }>({
    mutationFn: (vars) => addToCart(vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
  });
};

export const updateCartItem = (productId: string, data: { quantity: number }) =>
  apiRequest<Cart>(`/cart/items/${productId}`, { method: "PATCH", data });
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation<Cart, ApiError, { productId: string; data: { quantity: number } }>({
    mutationFn: (vars) => updateCartItem(vars.productId, vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
  });
};

export const removeFromCart = (productId: string) => apiRequest<Cart>(`/cart/items/${productId}`, { method: "DELETE" });
export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  return useMutation<Cart, ApiError, { productId: string }>({
    mutationFn: (vars) => removeFromCart(vars.productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
  });
};

export const clearCart = () => apiRequest<{ message: string }>("/cart/clear", { method: "DELETE" });
export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, void>({
    mutationFn: () => clearCart(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
  });
};

export const applyCoupon = (code: string) => apiRequest<Cart>("/cart/coupon", { method: "POST", data: { code } });
export const useApplyCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation<Cart, ApiError, { data: { code: string } }>({
    mutationFn: (vars) => applyCoupon(vars.data.code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
  });
};

export const removeCoupon = () => apiRequest<Cart>("/cart/coupon", { method: "DELETE" });
export const useRemoveCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation<Cart, ApiError, void>({
    mutationFn: () => removeCoupon(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
  });
};
