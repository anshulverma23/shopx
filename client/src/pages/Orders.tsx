import { useListOrders } from "@/api";
import { shortId } from "@/lib/utils";
import { RootLayout } from "@/components/layout/RootLayout";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Package, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  packed: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  shipped: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  delivered: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  returned: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export default function Orders() {
  const { data, isLoading } = useListOrders();

  return (
    <RootLayout>
      <div className="bg-muted/30 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-extrabold tracking-tight">My Orders</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        ) : data?.length === 0 ? (
          <div className="text-center py-24 bg-muted/30 rounded-2xl">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">When you place an order, it will show up here.</p>
            <Link href="/products" className="text-primary font-medium hover:underline">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {data?.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="block bg-card border rounded-2xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="bg-muted/30 p-4 border-b flex flex-wrap justify-between items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order Placed</p>
                      <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-semibold">₹{order.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order #</p>
                      <p className="font-semibold uppercase font-mono">{shortId(order.id)}</p>
                    </div>
                    <Badge variant="outline" className={`ml-auto ${statusColors[order.status]} capitalize px-3 py-1 text-sm`}>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="h-20 w-20 bg-muted rounded-xl border overflow-hidden relative">
                          <img src={item.imageUrl || `https://picsum.photos/seed/${item.productId}/100/100`} alt={item.name} className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 right-0 bg-background/80 backdrop-blur text-xs font-bold px-1.5 py-0.5 rounded-tl-lg">x{item.quantity}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="h-20 w-20 bg-muted rounded-xl border flex items-center justify-center text-muted-foreground font-medium">
                          +{order.items.length - 3} more
                        </div>
                      )}
                    </div>
                    
                    <div className="hidden sm:flex items-center text-primary font-medium group-hover:underline">
                      View Details <ChevronRight className="ml-1 h-5 w-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RootLayout>
  );
}
