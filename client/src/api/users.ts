import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type { Address, User } from "./types";

// ── Profile ─────────────────────────────────────────────────────────────
export const getMe = () => apiRequest<User>("/users/me");
export const getGetMeQueryKey = () => ["users", "me"];
export const useGetMe = (options?: { query?: { enabled?: boolean } }) =>
  useQuery<User, ApiError>({
    queryKey: getGetMeQueryKey(),
    queryFn: getMe,
    retry: false,
    ...options?.query,
  });

export interface UpdateMeInput {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}
export const updateMe = (data: UpdateMeInput) => apiRequest<User>("/users/me", { method: "PATCH", data });
export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation<User, ApiError, { data: UpdateMeInput }>({
    mutationFn: (vars) => updateMe(vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }),
  });
};

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
export const changePassword = (data: ChangePasswordInput) =>
  apiRequest<{ message: string }>("/users/me/change-password", { method: "POST", data });
export const useChangePassword = () =>
  useMutation<{ message: string }, ApiError, { data: ChangePasswordInput }>({
    mutationFn: (vars) => changePassword(vars.data),
  });

// ── Addresses ───────────────────────────────────────────────────────────
export const getAddresses = () => apiRequest<Address[]>("/users/addresses");
export const getGetAddressesQueryKey = () => ["users", "addresses"];
export const useGetAddresses = (options?: { query?: { enabled?: boolean } }) =>
  useQuery<Address[], ApiError>({
    queryKey: getGetAddressesQueryKey(),
    queryFn: getAddresses,
    ...options?.query,
  });

export type AddressInput = Omit<Address, "id" | "userId">;

export const createAddress = (data: Partial<AddressInput>) =>
  apiRequest<Address>("/users/addresses", { method: "POST", data });
export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<Address, ApiError, { data: Partial<AddressInput> }>({
    mutationFn: (vars) => createAddress(vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() }),
  });
};

export const updateAddress = (id: string, data: Partial<AddressInput>) =>
  apiRequest<Address>(`/users/addresses/${id}`, { method: "PATCH", data });
export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<Address, ApiError, { id: string; data: Partial<AddressInput> }>({
    mutationFn: (vars) => updateAddress(vars.id, vars.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() }),
  });
};

export const deleteAddress = (id: string) =>
  apiRequest<{ message: string }>(`/users/addresses/${id}`, { method: "DELETE" });
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { id: string }>({
    mutationFn: (vars) => deleteAddress(vars.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() }),
  });
};
