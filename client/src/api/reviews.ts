import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type { Review } from "./types";
import { getGetProductQueryKey } from "./products";

export const getProductReviews = (productId: string) => apiRequest<Review[]>(`/products/${productId}/reviews`);
export const getGetProductReviewsQueryKey = (productId?: string) => ["products", productId, "reviews"];
export const useGetProductReviews = (productId?: string, options?: { query?: { enabled?: boolean } }) =>
  useQuery<Review[], ApiError>({
    queryKey: getGetProductReviewsQueryKey(productId),
    queryFn: () => getProductReviews(productId as string),
    ...options?.query,
  });

export interface CreateReviewInput {
  rating: number;
  comment: string;
}
export const createReview = (productId: string, data: CreateReviewInput) =>
  apiRequest<Review>(`/products/${productId}/reviews`, { method: "POST", data });
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation<Review, ApiError, { productId: string; data: CreateReviewInput }>({
    mutationFn: (vars) => createReview(vars.productId, vars.data),
    onSuccess: (_result, vars) => {
      queryClient.invalidateQueries({ queryKey: getGetProductReviewsQueryKey(vars.productId) });
      queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(vars.productId) });
    },
  });
};
