import { useAdminListOrders } from "@/api";
import { shortId } from "@/lib/utils";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Link } from "wouter";

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading } = useAdminListOrders({
    status: (statusFilter === "all" ? undefined : statusFilter) as any
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Orders</h1>
            <p className="text-muted-foreground">Global view of all transactions.</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
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
                  <th className="h-12 px-6 text-left align-middle font-medium">Customer</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Total</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Status</th>
                  <th className="h-12 px-6 text-right align-middle font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={6} className="h-24 text-center">Loading...</td></tr>
                ) : (!data || data.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="h-48 text-center text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-20"/> No orders found.
                    </td>
                  </tr>
                ) : (
                  data.map((order) => (
                    <tr key={order.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="p-6 align-middle font-mono font-medium">#{shortId(order.id)}</td>
                      <td className="p-6 align-middle">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-6 align-middle">User #{shortId(order.userId)}</td>
                      <td className="p-6 align-middle font-bold">₹{order.total.toFixed(2)}</td>
                      <td className="p-6 align-middle">
                        <Badge variant="outline" className="capitalize">{order.status}</Badge>
                      </td>
                      <td className="p-6 align-middle text-right">
                        <Link href={`/orders/${order.id}`} className="text-primary hover:underline font-medium">View</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
