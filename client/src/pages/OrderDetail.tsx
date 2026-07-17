import { useGetOrder, useCancelOrder, useReturnOrder, getGetOrderQueryKey, getListOrdersQueryKey } from "@/api";
import { useCreateRazorpayOrder, openRazorpayCheckout, useVerifyRazorpayPayment } from "@/api";
import { RootLayout } from "@/components/layout/RootLayout";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, ArrowLeft, Ban, RefreshCcw, MapPin, CreditCard, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { shortId } from "@/lib/utils";

const TIMELINE_STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"];

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const id = params?.id;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: order, isLoading } = useGetOrder(id, { query: { enabled: !!id } });
  const cancelOrder = useCancelOrder();
  const returnOrder = useReturnOrder();
  const createRazorpayOrder = useCreateRazorpayOrder();
  const verifyPayment = useVerifyRazorpayPayment();
  const [isPayingNow, setIsPayingNow] = useState(false);

  const [returnReason, setReturnReason] = useState("");
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  if (isLoading) return <RootLayout><div className="p-24 container mx-auto"><Skeleton className="h-96 w-full rounded-2xl" /></div></RootLayout>;
  if (!order) return <RootLayout><div className="p-24 text-center">Order not found</div></RootLayout>;

  const currentStepIdx = TIMELINE_STEPS.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const isReturned = order.status === "returned";

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel this order?")) {
      cancelOrder.mutate({ id: id! }, {
        onSuccess: () => {
          toast.success("Order cancelled");
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({}) });
        },
        onError: () => toast.error("Failed to cancel order")
      });
    }
  };

  const handleReturn = () => {
    if (!returnReason.trim()) {
      toast.error("Please provide a reason for return");
      return;
    }
    returnOrder.mutate({ id: id!, data: { reason: returnReason } }, {
      onSuccess: () => {
        toast.success("Return request submitted");
        setIsReturnModalOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({}) });
      },
      onError: () => toast.error("Failed to submit return request")
    });
  };

  const handlePayNow = () => {
    if (!id) return;
    setIsPayingNow(true);
    createRazorpayOrder.mutate({ orderId: id }, {
      onSuccess: (details) => {
        openRazorpayCheckout({
          details,
          orderId: id,
          name: "ShopX",
          description: `Order #${shortId(id)}`,
          prefill: { name: user?.name, email: user?.email, contact: user?.phone ?? undefined },
          onSuccess: (payload) => {
            verifyPayment.mutate({ data: payload }, {
              onSuccess: () => {
                toast.success("Payment successful!");
                setIsPayingNow(false);
              },
              onError: () => {
                toast.error("Payment verification failed. Please try again or contact support.");
                setIsPayingNow(false);
              }
            });
          },
          onDismiss: () => setIsPayingNow(false),
        }).catch(() => {
          setIsPayingNow(false);
          toast.error("Failed to load the payment window. Please try again.");
        });
      },
      onError: () => {
        setIsPayingNow(false);
        toast.error("Failed to start payment. Please try again.");
      }
    });
  };

  return (
    <RootLayout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-4 text-sm text-muted-foreground flex items-center gap-2">
          <Link href="/orders" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Order #{shortId(order.id)}</h1>
            <p className="text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}</p>
          </div>
          <div className="flex gap-3">
            {order.paymentMethod === 'razorpay' && order.paymentStatus === 'pending' && !['cancelled', 'returned'].includes(order.status) && (
              <Button onClick={handlePayNow} disabled={isPayingNow || createRazorpayOrder.isPending}>
                <Wallet className="mr-2 h-4 w-4" /> {isPayingNow ? "Processing..." : "Pay Now"}
              </Button>
            )}
            {['pending', 'confirmed'].includes(order.status) && (
              <Button variant="destructive" onClick={handleCancel} disabled={cancelOrder.isPending}>
                <Ban className="mr-2 h-4 w-4" /> Cancel Order
              </Button>
            )}
            {order.status === 'delivered' && (
              <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Return Items
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Return Order</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for returning this order.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="E.g. Item defective, wrong size..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="my-4"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleReturn} disabled={returnOrder.isPending}>Submit Return</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Status Timeline */}
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-6">Order Status</h3>
                
                {isCancelled ? (
                  <div className="flex items-center gap-4 text-destructive bg-destructive/10 p-4 rounded-xl">
                    <Ban className="h-6 w-6" />
                    <div>
                      <p className="font-bold">Order Cancelled</p>
                      <p className="text-sm">This order has been cancelled and will not be shipped.</p>
                    </div>
                  </div>
                ) : isReturned ? (
                  <div className="flex items-center gap-4 text-slate-600 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
                    <RefreshCcw className="h-6 w-6" />
                    <div>
                      <p className="font-bold">Order Returned</p>
                      <p className="text-sm">A return has been processed for this order.</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted"></div>
                    <div className="space-y-6">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const isCompleted = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        
                        return (
                          <div key={step} className={`relative flex items-center gap-4 ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                              isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                              isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted border-2'
                            }`}>
                              {idx === 0 && <Package className="h-4 w-4" />}
                              {idx === 1 && <div className="h-2 w-2 rounded-full bg-current" />}
                              {idx === 2 && <Package className="h-4 w-4" />}
                              {idx === 3 && <Truck className="h-4 w-4" />}
                              {idx === 4 && <div className="h-2 w-2 rounded-full bg-current" />}
                            </div>
                            <div>
                              <p className="font-semibold capitalize">{step}</p>
                              {isCurrent && order.trackingNumber && (
                                <p className="text-sm mt-1 text-primary">Tracking: {order.trackingNumber}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-6">Order Items ({order.items.length})</h3>
                <div className="space-y-6">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex gap-4">
                      <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden shrink-0 border">
                        <img 
                          src={item.imageUrl || `https://picsum.photos/seed/${item.productId}/100/100`} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <Link href={`/products/${item.productId}`}>
                          <h4 className="font-semibold hover:text-primary transition-colors line-clamp-2">{item.name}</h4>
                        </Link>
                        <div className="mt-1 flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Qty: {item.quantity}</span>
                          <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Payment Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal?.toFixed(2) || order.total.toFixed(2)}</span>
                  </div>
                  {order.discount && order.discount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount</span>
                      <span>-₹{order.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground border-b pb-3">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-base">Total</span>
                    <span className="font-black text-xl">₹{order.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium flex items-center gap-2 mb-2"><CreditCard className="h-4 w-4 text-primary" /> Payment Method</h4>
                  <p className="text-sm text-muted-foreground uppercase">{order.paymentMethod || 'N/A'}</p>
                  <p className="text-sm mt-1">
                    Status: <Badge variant="outline" className="capitalize text-xs">{order.paymentStatus || 'Pending'}</Badge>
                  </p>
                </div>
              </CardContent>
            </Card>

            {order.address && (
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4"><MapPin className="h-5 w-5 text-primary" /> Shipping Address</h3>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p className="font-medium text-foreground">{order.address.name}</p>
                    <p>{order.address.line1}</p>
                    {order.address.line2 && <p>{order.address.line2}</p>}
                    <p>{order.address.city}, {order.address.state} {order.address.pincode}</p>
                    <p>{order.address.country}</p>
                    <p className="pt-2">Phone: {order.address.phone}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
