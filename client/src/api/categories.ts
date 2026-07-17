import { useQuery } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type { Category, Brand } from "./types";

export const listCategories = () => apiRequest<Category[]>("/categories");
export const useListCategories = () =>
  useQuery<Category[], ApiError>({ queryKey: ["categories", "list"], queryFn: listCategories });

export const listBrands = () => apiRequest<Brand[]>("/brands");
export const useListBrands = () => useQuery<Brand[], ApiError>({ queryKey: ["brands", "list"], queryFn: listBrands });
