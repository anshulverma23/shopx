import { useListSellerOrders, useUpdateOrderStatus, getListSellerOrdersQueryKey } from "@/api";
import { shortId } from "@/lib/utils";
import { SellerLayout } from "@/components/layout/AdminLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, Search } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"];

export default function SellerOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, isLoading } = useListSellerOrders({
    status: (statusFilter || undefined) as any
  });
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatus.mutate({ id: orderId, data: { status: newStatus as any } }, {
      onSuccess: () => {
        toast.success(`Order status updated to ${newStatus}`);
        queryClient.invalidateQueries({ queryKey: getListSellerOrdersQueryKey({}) });
      },
      onError: () => toast.error("Failed to update status")
    });
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">Process and fulfill customer orders.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search order ID or customer..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Orders</SelectItem>
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-12 px-6 text-left align-middle font-medium">Order ID</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Date</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Items</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Total</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Payment</th>
                  <th className="h-12 px-6 text-right align-middle font-medium w-48">Status Update</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={6} className="h-24 text-center">Loading...</td></tr>
                ) : data?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-48 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-muted-foreground">No orders found.</p>
                    </td>
                  </tr>
                ) : (
                  data?.map((order) => (
                    <tr key={order.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="p-6 align-middle font-mono font-medium">#{shortId(order.id)}</td>
                      <td className="p-6 align-middle">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-6 align-middle">
                        <div className="flex -space-x-2">
                          {order.items.slice(0,3).map((item, idx) => (
                            <img key={idx} src={item.imageUrl || `https://picsum.photos/seed/${item.productId}/40/40`} className="h-8 w-8 rounded-full border-2 border-background object-cover bg-muted" alt="item" />
                          ))}
                          {order.items.length > 3 && (
                            <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium z-10">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-6 align-middle font-bold">₹{order.total.toFixed(2)}</td>
                      <td className="p-6 align-middle">
                        <Badge variant="outline" className="uppercase text-[10px]">{order.paymentMethod}</Badge>
                      </td>
                      <td className="p-6 align-middle text-right">
                        <Select 
                          value={order.status} 
                          onValueChange={(val) => handleStatusChange(order.id, val)}
                          disabled={order.status === "cancelled" || order.status === "returned" || order.status === "delivered"}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
}
