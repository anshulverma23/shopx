import { useListSellerProducts, useDeleteProduct, getListSellerProductsQueryKey } from "@/api";
import { SellerLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function SellerProducts() {
  const { data, isLoading } = useListSellerProducts({});
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          toast.success("Product deleted");
          queryClient.invalidateQueries({ queryKey: getListSellerProductsQueryKey({}) });
        },
        onError: () => toast.error("Failed to delete product")
      });
    }
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory.</p>
          </div>
          <Link href="/seller/products/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
          </Link>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-12 px-6 text-left align-middle font-medium">Product</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Price</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Stock</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Status</th>
                  <th className="h-12 px-6 text-right align-middle font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="h-24 text-center">Loading...</td>
                  </tr>
                ) : data?.products?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-48 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-muted-foreground">No products found. Start by adding one.</p>
                    </td>
                  </tr>
                ) : (
                  data?.products?.map((product) => (
                    <tr key={product.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="p-6 align-middle">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                            <img src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/100/100`} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 align-middle font-medium">₹{product.price.toFixed(2)}</td>
                      <td className="p-6 align-middle">
                        <Badge variant={product.stock > 10 ? "secondary" : "destructive"}>{product.stock} in stock</Badge>
                      </td>
                      <td className="p-6 align-middle">
                        <Badge variant="outline" className="capitalize">{product.status}</Badge>
                      </td>
                      <td className="p-6 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/seller/products/${product.id}/edit`}>
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </SellerLayout>
  );
}
