import { useMutation } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type { AuthResponse } from "./types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: "buyer" | "seller";
}

export const login = (data: LoginInput) => apiRequest<AuthResponse>("/auth/login", { method: "POST", data });
export const useLogin = () => useMutation<AuthResponse, ApiError, { data: LoginInput }>({
  mutationFn: (vars) => login(vars.data),
});

export const register = (data: RegisterInput) =>
  apiRequest<AuthResponse>("/auth/register", { method: "POST", data });
export const useRegister = () => useMutation<AuthResponse, ApiError, { data: RegisterInput }>({
  mutationFn: (vars) => register(vars.data),
});

export const googleAuth = (credential: string, role?: "buyer" | "seller") =>
  apiRequest<AuthResponse>("/auth/google", { method: "POST", data: { credential, role } });
export const useGoogleAuth = () => useMutation<AuthResponse, ApiError, { data: { credential: string; role?: "buyer" | "seller" } }>({
  mutationFn: (vars) => googleAuth(vars.data.credential, vars.data.role),
});

export const logout = () => apiRequest<{ message: string }>("/auth/logout", { method: "POST" });
export const useLogout = () => useMutation<{ message: string }, ApiError, void>({
  mutationFn: () => logout(),
});

export const forgotPassword = (email: string) =>
  apiRequest<{ message: string }>("/auth/forgot-password", { method: "POST", data: { email } });
export const useForgotPassword = () => useMutation<{ message: string }, ApiError, { data: { email: string } }>({
  mutationFn: (vars) => forgotPassword(vars.data.email),
});

export const resetPassword = (data: { token: string; password: string }) =>
  apiRequest<{ message: string }>("/auth/reset-password", { method: "POST", data });
export const useResetPassword = () =>
  useMutation<{ message: string }, ApiError, { data: { token: string; password: string } }>({
    mutationFn: (vars) => resetPassword(vars.data),
  });

export const verifyOtp = (data: { email: string; otp: string }) =>
  apiRequest<{ message: string }>("/auth/verify-otp", { method: "POST", data });
export const useVerifyOtp = () =>
  useMutation<{ message: string }, ApiError, { data: { email: string; otp: string } }>({
    mutationFn: (vars) => verifyOtp(vars.data),
  });

export const resendOtp = (email: string) =>
  apiRequest<{ message: string }>("/auth/resend-otp", { method: "POST", data: { email } });
export const useResendOtp = () => useMutation<{ message: string }, ApiError, { data: { email: string } }>({
  mutationFn: (vars) => resendOtp(vars.data.email),
});
