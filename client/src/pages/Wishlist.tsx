import { useGetWishlist } from "@/api";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";
import { Link } from "wouter";

export default function Wishlist() {
  const { data: wishlist, isLoading } = useGetWishlist();

  return (
    <RootLayout>
      <div className="bg-muted/30 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <Heart className="h-8 w-8 text-destructive fill-destructive" /> My Wishlist
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[400px] rounded-xl" />)}
          </div>
        ) : wishlist?.length === 0 ? (
          <div className="text-center py-24 max-w-md mx-auto">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-30" />
            <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8">Save items you like and they will appear here for you to buy later.</p>
            <Link href="/products" className="text-primary font-medium hover:underline">Discover products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlist?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </RootLayout>
  );
}
