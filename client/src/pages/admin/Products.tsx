import { useAdminListProducts, useAdminUpdateProductStatus, getAdminListProductsQueryKey } from "@/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Check, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data, isLoading } = useAdminListProducts({
    q: search || undefined, status: (statusFilter === "all" ? undefined : statusFilter) as any
  });
  
  const updateStatus = useAdminUpdateProductStatus();
  const queryClient = useQueryClient();

  const handleStatusUpdate = (productId: string, newStatus: string) => {
    updateStatus.mutate({ id: productId, data: { status: newStatus } }, {
      onSuccess: () => {
        toast.success(`Product ${newStatus}`);
        queryClient.invalidateQueries({ queryKey: getAdminListProductsQueryKey({}) });
      },
      onError: () => toast.error("Failed to update product status")
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products Review</h1>
          <p className="text-muted-foreground">Review and approve seller product submissions.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search product name..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-12 px-6 text-left align-middle font-medium">Product</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Seller</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Price</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Status</th>
                  <th className="h-12 px-6 text-right align-middle font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={5} className="h-24 text-center">Loading...</td></tr>
                ) : data?.products?.length === 0 ? (
                  <tr><td colSpan={5} className="h-48 text-center text-muted-foreground">No products found.</td></tr>
                ) : (
                  data?.products?.map((product) => (
                    <tr key={product.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            <img src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/100/100`} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="max-w-[200px]">
                            <p className="font-semibold truncate" title={product.name}>{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="font-medium">{product.sellerName}</span>
                      </td>
                      <td className="p-4 align-middle font-medium text-lg">
                        ₹{product.price.toFixed(2)}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant={product.status === 'approved' ? 'default' : product.status === 'pending' ? 'secondary' : 'destructive'} className="capitalize">
                          {product.status}
                        </Badge>
                        {product.isFeatured && <Badge variant="secondary" className="ml-2 bg-yellow-500/20 text-yellow-700 border-0"><Star className="h-3 w-3 mr-1"/> Featured</Badge>}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          {product.status === 'pending' ? (
                            <>
                              <Button size="icon" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleStatusUpdate(product.id, 'rejected')}><X className="h-4 w-4"/></Button>
                              <Button size="icon" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusUpdate(product.id, 'approved')}><Check className="h-4 w-4"/></Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(product.id, product.status === 'approved' ? 'rejected' : 'approved')}>
                              {product.status === 'approved' ? 'Revoke Approval' : 'Approve Product'}
                            </Button>
                          )}
                        </div>
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
