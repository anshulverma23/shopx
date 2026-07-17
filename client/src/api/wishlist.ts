import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type { Product } from "./types";

export const getWishlist = () => apiRequest<Product[]>("/wishlist");
export const getGetWishlistQueryKey = () => ["wishlist"];
export const useGetWishlist = (options?: { query?: { enabled?: boolean } }) =>
  useQuery<Product[], ApiError>({ queryKey: getGetWishlistQueryKey(), queryFn: getWishlist, ...options?.query });

export const addToWishlist = (productId: string) =>
  apiRequest<{ message: string }>("/wishlist", { method: "POST", data: { productId } });
export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { data: { productId: string } }>({
    mutationFn: (vars) => addToWishlist(vars.data.productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() }),
  });
};

export const removeFromWishlist = (productId: string) =>
  apiRequest<{ message: string }>(`/wishlist/${productId}`, { method: "DELETE" });
export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { productId: string }>({
    mutationFn: (vars) => removeFromWishlist(vars.productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() }),
  });
};
