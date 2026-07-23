import { useAdminListSellers, useAdminUpdateSellerStatus, getAdminListSellersQueryKey } from "@/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Check, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function AdminSellers() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading } = useAdminListSellers({
    status: (statusFilter === "all" ? undefined : statusFilter) as any
  });
  
  const updateStatus = useAdminUpdateSellerStatus();
  const queryClient = useQueryClient();

  const handleStatusUpdate = (sellerId: string, newStatus: string) => {
    updateStatus.mutate({ id: sellerId, data: { status: newStatus as any } }, {
      onSuccess: () => {
        toast.success(`Seller status updated to ${newStatus}`);
        queryClient.invalidateQueries({ queryKey: getAdminListSellersQueryKey({}) });
      },
      onError: () => toast.error("Failed to update seller status")
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sellers Overview</h1>
            <p className="text-muted-foreground">Manage and review merchant accounts.</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />)
          ) : data?.map((seller) => (
            <div key={seller.id} className="bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                    {seller.logoUrl ? <img src={seller.logoUrl} alt="" className="w-full h-full object-cover rounded-xl"/> : <Store className="h-6 w-6"/>}
                  </div>
                  <Badge variant={
                    seller.status === 'approved' ? 'default' : 
                    seller.status === 'pending' ? 'secondary' : 'destructive'
                  } className="capitalize">
                    {seller.status}
                  </Badge>
                </div>
                <h3 className="font-bold text-xl mb-1 truncate">{seller.storeName}</h3>
                <p className="text-sm text-muted-foreground mb-4">Joined {new Date(seller.createdAt!).toLocaleDateString()}</p>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-y text-sm">
                  <div>
                    <p className="text-muted-foreground">Products</p>
                    <p className="font-semibold">{seller.totalProducts || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sales</p>
                    <p className="font-semibold">₹{seller.totalSales?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 p-4 border-t flex gap-2 justify-end">
                {seller.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleStatusUpdate(seller.id, 'rejected')}>
                      <X className="mr-1 h-4 w-4"/> Reject
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate(seller.id, 'approved')}>
                      <Check className="mr-1 h-4 w-4"/> Approve
                    </Button>
                  </>
                )}
                {seller.status === 'approved' && (
                  <Button size="sm" variant="outline" className="text-orange-600 hover:bg-orange-500/10 border-orange-500/20" onClick={() => handleStatusUpdate(seller.id, 'suspended')}>
                    <ShieldAlert className="mr-1 h-4 w-4"/> Suspend Store
                  </Button>
                )}
                {(seller.status === 'suspended' || seller.status === 'rejected') && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(seller.id, 'approved')}>
                    <Check className="mr-1 h-4 w-4"/> Restore Access
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
