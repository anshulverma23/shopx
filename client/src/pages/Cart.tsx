import { useGetCart, useUpdateCartItem, useRemoveFromCart, useClearCart, useApplyCoupon, getGetCartQueryKey } from "@/api";
import { RootLayout } from "@/components/layout/RootLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function Cart() {
  const { data: cart, isLoading } = useGetCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const clearCart = useClearCart();
  const applyCoupon = useApplyCoupon();
  const queryClient = useQueryClient();

  const [couponCode, setCouponCode] = useState("");

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    updateItem.mutate({ data: { quantity }, productId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
    });
  };

  const handleRemove = (productId: string) => {
    removeItem.mutate({ productId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
    });
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    applyCoupon.mutate({ data: { code: couponCode } }, {
      onSuccess: () => {
        toast.success("Coupon applied");
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
      onError: () => toast.error("Invalid coupon code")
    });
  };

  if (isLoading) {
    return (
      <RootLayout>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </RootLayout>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <RootLayout>
      <div className="bg-muted/30 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Shopping Cart</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isEmpty ? (
          <div className="text-center py-24 max-w-md mx-auto">
            <div className="bg-muted h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet. Let's change that.</p>
            <Link href="/products">
              <Button size="lg" className="rounded-full w-full">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Items ({cart.itemCount})</h2>
                <Button variant="ghost" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10" onClick={() => {
                  clearCart.mutate(undefined, {
                    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
                  });
                }}>
                  <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
                </Button>
              </div>

              <div className="space-y-6">
                {cart.items.map((item) => (
                  <div key={item.productId} className="flex gap-6 p-4 rounded-2xl border bg-card hover:shadow-md transition-shadow">
                    <Link href={`/products/${item.productId}`} className="shrink-0">
                      <div className="h-28 w-28 rounded-xl bg-muted overflow-hidden">
                        <img 
                          src={item.images?.[0] || `https://picsum.photos/seed/${item.productId}/200/200`} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={`/products/${item.productId}`}>
                            <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">{item.name}</h3>
                          </Link>
                          {item.discountPrice ? (
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="font-bold">₹{item.discountPrice.toFixed(2)}</span>
                              <span className="text-sm text-muted-foreground line-through">₹{item.price.toFixed(2)}</span>
                            </div>
                          ) : (
                            <div className="mt-1 font-bold">₹{item.price.toFixed(2)}</div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemove(item.productId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border rounded-full bg-background overflow-hidden">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="w-10 text-center font-medium text-sm">{item.quantity}</div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="font-bold text-lg">
                          ₹{((item.discountPrice || item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{cart.subtotal.toFixed(2)}</span>
                  </div>
                  {cart.discount && cart.discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount</span>
                      <span>-₹{cart.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center mb-8">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-black">₹{cart.total.toFixed(2)}</span>
                </div>

                <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-8">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Coupon code" 
                      className="pl-9"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="secondary" disabled={applyCoupon.isPending}>Apply</Button>
                </form>

                <Link href="/checkout">
                  <Button size="lg" className="w-full rounded-full h-14 text-lg">
                    Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
