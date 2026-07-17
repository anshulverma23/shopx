import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type { CreateOrderResponse, Order, OrderStatus, PaymentMethod } from "./types";
import { getGetCartQueryKey } from "./cart";

export interface ListOrdersParams {
  status?: OrderStatus;
}
export const listOrders = (params?: ListOrdersParams) =>
  apiRequest<Order[]>("/orders", { params: params as Record<string, any> });
export const getListOrdersQueryKey = (params?: ListOrdersParams) => ["orders", "list", params ?? {}];
export const useListOrders = (params?: ListOrdersParams) =>
  useQuery<Order[], ApiError>({ queryKey: getListOrdersQueryKey(params), queryFn: () => listOrders(params) });

export const getOrder = (id: string) => apiRequest<Order>(`/orders/${id}`);
export const getGetOrderQueryKey = (id?: string) => ["orders", "detail", id];
export const useGetOrder = (id?: string, options?: { query?: { enabled?: boolean } }) =>
  useQuery<Order, ApiError>({
    queryKey: getGetOrderQueryKey(id),
    queryFn: () => getOrder(id as string),
    ...options?.query,
  });

export interface CreateOrderInput {
  addressId: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}
export const createOrder = (data: CreateOrderInput) =>
  apiRequest<CreateOrderResponse>("/orders", { method: "POST", data });
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateOrderResponse, ApiError, { data: CreateOrderInput }>({
    mutationFn: (vars) => createOrder(vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() }),
  });
};

export const cancelOrder = (id: string) => apiRequest<Order>(`/orders/${id}/cancel`, { method: "POST" });
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, ApiError, { id: string }>({
    mutationFn: (vars) => cancelOrder(vars.id),
    onSuccess: (_result, vars) => {
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(vars.id) });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    },
  });
};

export const returnOrder = (id: string, reason?: string) =>
  apiRequest<Order>(`/orders/${id}/return`, { method: "POST", data: { reason } });
export const useReturnOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, ApiError, { id: string; data?: { reason?: string } }>({
    mutationFn: (vars) => returnOrder(vars.id, vars.data?.reason),
    onSuccess: (_result, vars) => {
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(vars.id) });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    },
  });
};
