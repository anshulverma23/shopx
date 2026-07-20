import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, ApiError } from "./http";
import type { Order, RazorpayCheckoutDetails } from "./types";
import { getGetCartQueryKey } from "./cart";
import { getGetOrderQueryKey, getListOrdersQueryKey } from "./orders";

// ── Razorpay checkout.js loader ────────────────────────────────────────────
let razorpayScriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window !== "undefined" && (window as any).Razorpay) {
    return Promise.resolve(true);
  }
  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
  return razorpayScriptPromise;
}

// ── Create/retry a Razorpay order for an existing pending order ──────────
export const createRazorpayOrder = (orderId: string) =>
  apiRequest<RazorpayCheckoutDetails>(`/payments/razorpay/order/${orderId}`, {
    method: "POST",
  });
export const useCreateRazorpayOrder = () =>
  useMutation<RazorpayCheckoutDetails, ApiError, { orderId: string }>({
    mutationFn: (vars) => createRazorpayOrder(vars.orderId),
  });

// ── Verify payment after the checkout modal succeeds ──────────────────────
export interface VerifyRazorpayPaymentInput {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
export const verifyRazorpayPayment = (data: VerifyRazorpayPaymentInput) =>
  apiRequest<Order>("/payments/razorpay/verify", { method: "POST", data });
export const useVerifyRazorpayPayment = () => {
  const queryClient = useQueryClient();
  return useMutation<Order, ApiError, { data: VerifyRazorpayPaymentInput }>({
    mutationFn: (vars) => verifyRazorpayPayment(vars.data),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getGetOrderQueryKey(order.id),
      });
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    },
  });
};

export interface OpenRazorpayCheckoutParams {
  details: RazorpayCheckoutDetails;
  orderId: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (payload: VerifyRazorpayPaymentInput) => void;
  onDismiss?: () => void;
}

/** Opens the Razorpay checkout modal and resolves the verification payload on success. */
export async function openRazorpayCheckout(
  params: OpenRazorpayCheckoutParams,
): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || typeof window === "undefined" || !(window as any).Razorpay) {
    throw new Error(
      "Failed to load Razorpay checkout. Please check your connection and try again.",
    );
  }

  const RazorpayCtor = (window as any).Razorpay;
  const rzp = new RazorpayCtor({
    key: params.details.keyId,
    amount: params.details.amount,
    currency: params.details.currency,
    order_id: params.details.orderId,
    name: params.name,
    description: params.description,
    theme: { color: "#111827" },
    prefill: params.prefill,
    handler: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      params.onSuccess({
        orderId: params.orderId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });
    },
    modal: {
      ondismiss: () => params.onDismiss?.(),
    },
  });
  rzp.open();
}
