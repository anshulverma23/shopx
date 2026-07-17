import { useGetFeaturedProducts, useGetTrendingProducts, useListCategories } from "@/api";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowRight, Zap } from "lucide-react";

export default function Home() {
  const { data: featured, isLoading: isLoadingFeatured } = useGetFeaturedProducts();
  const { data: trending, isLoading: isLoadingTrending } = useGetTrendingProducts();
  const { data: categories, isLoading: isLoadingCategories } = useListCategories();

  return (
    <RootLayout>
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80" 
          alt="Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
        />
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary mb-6 backdrop-blur-sm border border-primary/30">
              <Zap className="h-4 w-4 mr-2" /> <span>Winter Flash Sale is Live</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Curated minimal <br />essentials.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-lg">
              Discover premium products designed to elevate your everyday. Crafted with intention, delivered with care.
            </p>
            <div className="flex gap-4">
              <Link href="/products">
                <Button size="lg" className="rounded-full text-base px-8 h-14 bg-white text-slate-900 hover:bg-slate-100">
                  Shop Now
                </Button>
              </Link>
              <Link href="/products?category=trending">
                <Button size="lg" variant="outline" className="rounded-full text-base px-8 h-14 border-white/20 hover:bg-white/10">
                  Explore
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 container mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoadingCategories ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)
          ) : (
            categories?.map((cat) => (
              <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                <div className="group cursor-pointer aspect-square rounded-2xl overflow-hidden relative flex items-center justify-center bg-muted">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors z-10" />
                  {cat.imageUrl && (
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.name} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                  <h3 className="relative z-20 text-white font-semibold text-lg">{cat.name}</h3>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Trending Now</h2>
              <p className="text-muted-foreground">The items everyone is talking about.</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="hidden sm:flex">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingTrending ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[400px] rounded-xl" />)
            ) : (
              trending?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Banner */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl overflow-hidden bg-primary text-primary-foreground relative px-8 py-16 md:p-24 flex items-center">
            <div className="relative z-20 max-w-xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Redefine your workspace.</h2>
              <p className="text-lg opacity-90 mb-8">
                Premium electronics and accessories for the modern professional. Upgrade your setup today and get 20% off your first order.
              </p>
              <Link href="/products?category=electronics">
                <Button size="lg" variant="secondary" className="rounded-full">
                  Shop Electronics
                </Button>
              </Link>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block">
               <img 
                 src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80" 
                 alt="Workspace" 
                 className="w-full h-full object-cover opacity-50"
               />
               <div className="absolute inset-0 bg-gradient-to-l from-transparent to-primary" />
            </div>
          </div>
        </div>
      </section>
    </RootLayout>
  );
}
