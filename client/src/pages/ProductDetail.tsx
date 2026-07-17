import { useGetProduct, useGetRelatedProducts, useGetProductReviews, useAddToCart, getGetCartQueryKey } from "@/api";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProductCard } from "@/components/ProductCard";
import { useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Star, ShoppingCart, Truck, ShieldCheck, ArrowLeft, Heart, Share2, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = params?.id;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(id, { query: { enabled: !!id } });
  const { data: relatedProducts } = useGetRelatedProducts(id, { query: { enabled: !!id } });
  const { data: reviews } = useGetProductReviews(id, { query: { enabled: !!id } });
  
  const addToCart = useAddToCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please log in to add items to cart");
      return;
    }
    addToCart.mutate({ data: { productId: id!, quantity } }, {
      onSuccess: () => {
        toast.success(`Added ${quantity} item(s) to cart`);
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
      onError: () => toast.error("Failed to add to cart")
    });
  };

  if (isLoading) {
    return (
      <RootLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </RootLayout>
    );
  }

  if (!product) return <RootLayout><div className="p-24 text-center">Product not found</div></RootLayout>;

  const images = product.images?.length ? product.images : [`https://picsum.photos/seed/${product.id}/800/800`];

  return (
    <RootLayout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-4 text-sm text-muted-foreground flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to {product.categoryName || 'Products'}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border relative group">
              <img 
                src={images[selectedImage]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {product.discountPercent && product.discountPercent > 0 && (
                <Badge className="absolute top-4 left-4 z-10 text-lg py-1 px-3 bg-destructive text-destructive-foreground">
                  -{product.discountPercent}% OFF
                </Badge>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-lg text-primary font-medium">{product.brandName || "Premium Brand"}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="rounded-full"><Share2 className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="rounded-full"><Heart className="h-4 w-4" /></Button>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center text-lg font-medium bg-secondary px-3 py-1 rounded-full">
                  <Star className="h-5 w-5 fill-primary text-primary mr-1.5" />
                  {product.rating.toFixed(1)} <span className="text-muted-foreground ml-1.5 font-normal">({product.reviewCount} reviews)</span>
                </div>
                <span className="text-sm text-green-600 font-medium bg-green-500/10 px-3 py-1 rounded-full">
                  In Stock ({product.stock} left)
                </span>
              </div>
            </div>

            <div className="mb-8">
              {product.discountPrice ? (
                <div className="flex items-end gap-4">
                  <span className="text-5xl font-black">₹{product.discountPrice.toFixed(2)}</span>
                  <span className="text-2xl text-muted-foreground line-through mb-1">₹{product.price.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-5xl font-black">₹{product.price.toFixed(2)}</span>
              )}
              <p className="text-sm text-muted-foreground mt-2">Inclusive of all taxes</p>
            </div>

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {product.description || "A premium product crafted with meticulous attention to detail. Designed to elevate your everyday experience."}
            </p>

            <div className="space-y-6 mb-8 flex-1">
              <div className="flex items-center gap-4">
                <span className="font-medium text-lg">Quantity</span>
                <div className="flex items-center border rounded-full overflow-hidden bg-background">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-12 w-12 rounded-none">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-16 text-center font-semibold text-lg">{quantity}</div>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="h-12 w-12 rounded-none">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="flex-1 h-14 text-lg rounded-full" onClick={handleAddToCart}>
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                <Button size="lg" variant="secondary" className="flex-1 h-14 text-lg rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  Buy Now
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-8">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-full"><Truck className="h-5 w-5" /></div>
                <div>
                  <h4 className="font-semibold">Free Delivery</h4>
                  <p className="text-sm text-muted-foreground">For orders over ₹500</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-full"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <h4 className="font-semibold">1 Year Warranty</h4>
                  <p className="text-sm text-muted-foreground">Manufacturer warranty</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Reviews Tabs */}
        <div className="mb-24">
          <Separator className="mb-12" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Specifications</h2>
              {product.specifications ? (
                <dl className="space-y-4 text-sm">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-2 border-b pb-2">
                      <dt className="text-muted-foreground font-medium">{key}</dt>
                      <dd className="font-medium text-right">{value as string}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-muted-foreground">No detailed specifications available.</p>
              )}
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
                <Button variant="outline">Write a Review</Button>
              </div>
              
              {reviews?.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-2xl">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h3 className="font-semibold text-lg">No reviews yet</h3>
                  <p className="text-muted-foreground">Be the first to review this product.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews?.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-secondary rounded-full flex items-center justify-center font-bold">
                            {review.userName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold">{review.userName || 'Anonymous User'}</p>
                            <div className="flex text-primary">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-primary' : 'fill-muted text-muted'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-muted-foreground mt-3">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-8">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
