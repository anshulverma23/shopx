import { Link } from "wouter";
import type { Product } from "@/api";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddToCart, useAddToWishlist, getGetCartQueryKey, getGetWishlistQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function ProductCard({ product }: { product: Product }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please log in to add items to cart");
      return;
    }
    if (product.stock === 0) {
      toast.error("Product is out of stock");
      return;
    }
    addToCart.mutate({ data: { productId: product.id, quantity: 1 } }, {
      onSuccess: () => {
        toast.success("Added to cart");
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
      onError: () => toast.error("Failed to add to cart")
    });
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please log in to add items to wishlist");
      return;
    }
    addToWishlist.mutate({ data: { productId: product.id } }, {
      onSuccess: () => {
        toast.success("Added to wishlist");
        queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
      },
      onError: () => toast.error("Failed to add to wishlist")
    });
  };

  const imageUrl = product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/400`;

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full flex flex-col overflow-hidden border-transparent hover:border-border transition-all duration-300 hover:shadow-xl glass-card cursor-pointer">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.discountPercent && product.discountPercent > 0 && (
            <Badge className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground">
              -{product.discountPercent}%
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 z-10 rounded-full bg-background/50 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleAddToWishlist}
          >
            <Heart className="h-4 w-4" />
          </Button>
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <CardContent className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-muted-foreground line-clamp-1">{product.brandName || "Generic"}</p>
            <div className="flex items-center text-xs font-medium">
              <Star className="h-3 w-3 fill-primary text-primary mr-1" />
              {product.rating.toFixed(1)} <span className="text-muted-foreground ml-1">({product.reviewCount})</span>
            </div>
          </div>
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight mb-2">{product.name}</h3>
          <div className="flex items-end gap-2 mt-auto">
            {product.discountPrice ? (
              <>
                <span className="text-xl font-bold">₹{product.discountPrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">₹{product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-xl font-bold">₹{product.price.toFixed(2)}</span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" /> {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
