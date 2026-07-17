import { useGetCart, useGetAddresses, useCreateOrder, getGetCartQueryKey } from "@/api";
import { openRazorpayCheckout, useVerifyRazorpayPayment } from "@/api";
import { RootLayout } from "@/components/layout/RootLayout";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, ShieldCheck, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { shortId } from "@/lib/utils";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: cart, isLoading: isCartLoading } = useGetCart();
  const { data: addresses, isLoading: isAddrLoading } = useGetAddresses();
  const createOrder = useCreateOrder();
  const verifyPayment = useVerifyRazorpayPayment();

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("razorpay");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Initial select
  if (!selectedAddress && addresses && addresses.length > 0) {
    setSelectedAddress(addresses[0].id);
  }

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    createOrder.mutate({
      data: {
        addressId: selectedAddress,
        paymentMethod: paymentMethod as any,
      }
    }, {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });

        if (response.razorpay) {
          // Online payment: open the Razorpay checkout modal and verify on success.
          setIsProcessingPayment(true);
          openRazorpayCheckout({
            details: response.razorpay,
            orderId: response.id,
            name: "ShopX",
            description: `Order #${shortId(response.id)}`,
            prefill: { name: user?.name, email: user?.email, contact: user?.phone ?? undefined },
            onSuccess: (payload) => {
              verifyPayment.mutate({ data: payload }, {
                onSuccess: () => {
                  toast.success("Payment successful — order placed!");
                  setIsProcessingPayment(false);
                  setLocation("/orders");
                },
                onError: () => {
                  setIsProcessingPayment(false);
                  toast.error("We couldn't verify your payment. Please check My Orders or contact support.");
                  setLocation("/orders");
                }
              });
            },
            onDismiss: () => {
              setIsProcessingPayment(false);
              toast.info("Payment cancelled. You can complete it anytime from My Orders.");
              setLocation("/orders");
            },
          }).catch(() => {
            setIsProcessingPayment(false);
            toast.error("Failed to load the payment window. Please try again.");
          });
        } else {
          // Cash on Delivery: the order is already confirmed.
          toast.success("Order placed successfully!");
          setLocation("/orders");
        }
      },
      onError: (error) => toast.error(error.message || "Failed to place order")
    });
  };

  if (isCartLoading || isAddrLoading) return <RootLayout><div className="p-24 text-center">Loading checkout...</div></RootLayout>;

  if (!cart || cart.items.length === 0) {
    return (
      <RootLayout>
        <div className="p-24 text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Link href="/"><Button>Return Home</Button></Link>
        </div>
      </RootLayout>
    );
  }

  const isPlacingOrder = createOrder.isPending || verifyPayment.isPending || isProcessingPayment;

  return (
    <RootLayout>
      <div className="bg-muted/30 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Checkout</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-12">
            {/* Address Selection */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><MapPin className="h-6 w-6 text-primary" /> Delivery Address</h2>
                <Link href="/profile">
                  <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4"/> Add New</Button>
                </Link>
              </div>
              
              {addresses && addresses.length > 0 ? (
                <RadioGroup value={selectedAddress ?? undefined} onValueChange={(val) => setSelectedAddress(val)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <Label
                      key={addr.id}
                      htmlFor={`addr-${addr.id}`}
                      className={`flex flex-col border rounded-xl p-4 cursor-pointer hover:border-primary transition-all ${selectedAddress === addr.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'bg-card'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-base">{addr.name}</span>
                        <RadioGroupItem value={addr.id} id={`addr-${addr.id}`} />
                      </div>
                      <span className="text-muted-foreground text-sm mb-1">{addr.line1}</span>
                      {addr.line2 && <span className="text-muted-foreground text-sm mb-1">{addr.line2}</span>}
                      <span className="text-muted-foreground text-sm">{addr.city}, {addr.state} {addr.pincode}</span>
                      <span className="text-muted-foreground text-sm mt-2 font-medium">{addr.phone}</span>
                    </Label>
                  ))}
                </RadioGroup>
              ) : (
                <div className="p-8 text-center border border-dashed rounded-xl bg-muted/30">
                  <p className="text-muted-foreground mb-4">No addresses saved yet.</p>
                  <Link href="/profile">
                    <Button><Plus className="mr-2 h-4 w-4"/> Add Address</Button>
                  </Link>
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary" /> Payment Method</h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                
                <Label htmlFor="pay-razorpay" className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'bg-card'}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Card / UPI / Netbanking</p>
                      <p className="text-sm text-muted-foreground">Secure payment via Razorpay</p>
                    </div>
                  </div>
                  <RadioGroupItem value="razorpay" id="pay-razorpay" />
                </Label>

                <Label htmlFor="pay-cod" className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'bg-card'}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-600">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
                    </div>
                  </div>
                  <RadioGroupItem value="cod" id="pay-cod" />
                </Label>

              </RadioGroup>
            </section>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Review Order</h2>
              
              <div className="space-y-4 mb-6">
                {cart.items.map(item => (
                  <div key={item.productId} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="font-medium px-2 py-0.5 bg-muted rounded text-xs">{item.quantity}x</div>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="font-medium whitespace-nowrap ml-4">₹{((item.discountPrice || item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-b py-4 my-4 space-y-3">
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Subtotal</span>
                  <span>₹{cart.subtotal.toFixed(2)}</span>
                </div>
                {cart.discount && cart.discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium text-sm">
                    <span>Discount</span>
                    <span>-₹{cart.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Shipping</span>
                  <span className="text-primary font-medium">Free</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-bold">Total</span>
                <span className="text-2xl font-black">₹{cart.total.toFixed(2)}</span>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 mb-6 flex gap-3 text-sm text-primary">
                <ShieldCheck className="h-5 w-5 shrink-0" />
                <p>Safe and secure payments. 100% Authentic products.</p>
              </div>

              <Button 
                size="lg" 
                className="w-full rounded-full h-14 text-lg shadow-lg hover:shadow-xl transition-all" 
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                {isPlacingOrder
                  ? "Processing..."
                  : paymentMethod === "cod"
                    ? "Place Order"
                    : `Pay ₹${cart.total.toFixed(2)}`}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </RootLayout>
  );
}
