import { useListProducts, useListCategories, useListBrands } from "@/api";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProductCard } from "@/components/ProductCard";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, SlidersHorizontal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Products() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || "";
  const initialQuery = searchParams.get("q") || "";

  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [debouncedPrice, setDebouncedPrice] = useState([0, 10000]);
  const [search, setSearch] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);

  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPrice(priceRange);
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [priceRange, search]);

  const { data, isLoading } = useListProducts({
    category: category || undefined,
    brand: brand || undefined,
    minPrice: debouncedPrice[0],
    maxPrice: debouncedPrice[1] === 10000 ? undefined : debouncedPrice[1],
    sort: sort as any,
    q: debouncedSearch || undefined,
  });

  return (
    <RootLayout>
      <div className="bg-muted/30 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Shop All Products</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Browse our complete collection of premium items. From electronics to fashion, find everything you need.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <div>
            <div className="flex items-center gap-2 font-semibold text-lg mb-4 pb-2 border-b">
              <SlidersHorizontal className="h-5 w-5" /> Filters
            </div>
            
            <div className="space-y-6">
              {/* Search */}
              <div className="space-y-3">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label>Category</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="cat-all" 
                      checked={category === ""} 
                      onCheckedChange={() => setCategory("")} 
                    />
                    <label htmlFor="cat-all" className="text-sm font-medium leading-none cursor-pointer">
                      All Categories
                    </label>
                  </div>
                  {categories?.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cat-${cat.id}`} 
                        checked={category === cat.slug} 
                        onCheckedChange={(checked) => setCategory(checked ? cat.slug : "")} 
                      />
                      <label htmlFor={`cat-${cat.id}`} className="text-sm font-medium leading-none cursor-pointer">
                        {cat.name} <span className="text-muted-foreground">({cat.productCount})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div className="space-y-3">
                <Label>Brand</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="brand-all" 
                      checked={brand === ""} 
                      onCheckedChange={() => setBrand("")} 
                    />
                    <label htmlFor="brand-all" className="text-sm font-medium leading-none cursor-pointer">
                      All Brands
                    </label>
                  </div>
                  {brands?.map((b) => (
                    <div key={b.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`brand-${b.id}`} 
                        checked={brand === b.slug} 
                        onCheckedChange={(checked) => setBrand(checked ? b.slug : "")} 
                      />
                      <label htmlFor={`brand-${b.id}`} className="text-sm font-medium leading-none cursor-pointer">
                        {b.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Price Range</Label>
                  <span className="text-sm text-muted-foreground">
                    ₹{priceRange[0]} - {priceRange[1] >= 10000 ? '₹10k+' : `₹${priceRange[1]}`}
                  </span>
                </div>
                <Slider 
                  defaultValue={[0, 10000]} 
                  max={10000} 
                  step={50} 
                  value={priceRange}
                  onValueChange={setPriceRange}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{data?.total || 0}</span> results
            </p>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap hidden sm:block">Sort by</Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[400px] rounded-xl" />)
            ) : data?.products.length === 0 ? (
              <div className="col-span-full py-24 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your filters or search query.</p>
                <Button onClick={() => {
                  setCategory("");
                  setBrand("");
                  setPriceRange([0, 10000]);
                  setSearch("");
                }} variant="outline">
                  Clear all filters
                </Button>
              </div>
            ) : (
              data?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </main>
      </div>
    </RootLayout>
  );
}
