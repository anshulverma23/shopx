import { useGetProduct, useCreateProduct, useUpdateProduct, useListCategories, useListBrands } from "@/api";
import { SellerLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, ArrowLeft, Loader2, X } from "lucide-react";
import { useEffect } from "react";

const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  discountPrice: z.coerce.number().optional().nullable().refine(
    (val) => val === undefined || val === null || val >= 0,
    "Discount price cannot be negative"
  ),
  stock: z.coerce.number().min(0, "Stock cannot be negative").int("Stock must be a whole number"),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  images: z.array(z.string().url("Must be a valid URL")).max(5),
  tags: z.array(z.string()).optional(),
  specifications: z.record(z.string()).optional(),
}).refine(data => {
  if (data.discountPrice && data.price && data.discountPrice >= data.price) {
    return false;
  }
  return true;
}, {
  message: "Discount price must be less than the regular price",
  path: ["discountPrice"],
});

export default function ProductForm() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/seller/products/:id/edit");
  const isEditing = match && params?.id !== "new";
  const productId = isEditing ? (params?.id ?? null) : null;

  const { data: product, isLoading: isLoadingProduct } = useGetProduct(productId ?? undefined, { query: { enabled: !!productId } });
  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      discountPrice: null,
      stock: 0,
      images: [],
      tags: [],
      specifications: {}
    },
  });

  useEffect(() => {
    if (isEditing && product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        discountPrice: product.discountPrice,
        stock: product.stock,
        categoryId: product.categoryId || undefined,
        brandId: product.brandId || undefined,
        images: product.images || [],
        tags: (product as any).tags || [],
        specifications: (product as any).specifications || {}
      });
    }
  }, [product, isEditing, form]);

  const onSubmit = (values: z.infer<typeof schema>) => {
    if (isEditing && productId) {
      updateMutation.mutate({ id: productId, data: values }, {
        onSuccess: () => {
          toast.success("Product updated successfully");
          setLocation("/seller/products");
        },
        onError: () => toast.error("Failed to update product")
      });
    } else {
      createMutation.mutate({ data: values as any }, {
        onSuccess: () => {
          toast.success("Product created successfully");
          setLocation("/seller/products");
        },
        onError: () => toast.error("Failed to create product")
      });
    }
  };

  const addImageUrl = () => {
    const images = form.getValues("images");
    if (images.length >= 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    const newUrl = prompt("Enter image URL");
    if (newUrl) {
      try {
        new URL(newUrl); // Validate URL
        form.setValue("images", [...images, newUrl], { shouldValidate: true, shouldDirty: true });
      } catch (e) {
        toast.error("Invalid URL");
      }
    }
  };

  const removeImageUrl = (index: number) => {
    const images = form.getValues("images");
    form.setValue("images", images.filter((_, i) => i !== index), { shouldValidate: true, shouldDirty: true });
  };

  if (isEditing && isLoadingProduct) {
    return <SellerLayout><div className="p-24 text-center">Loading product data...</div></SellerLayout>;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <SellerLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/seller/products")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Product" : "New Product"}</h1>
            <p className="text-muted-foreground">{isEditing ? "Update product details and pricing" : "Add a new product to your store"}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Info */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Wireless Noise-Cancelling Headphones" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the product..." className="h-32" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={(val) => field.onChange(val)} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="brandId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <Select onValueChange={(val) => field.onChange(val)} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {brands?.map(b => (
                                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing & Inventory */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Pricing & Inventory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Regular Price (₹)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="discountPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Price (₹)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Available Stock</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1 space-y-8">
                {/* Images */}
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Images</CardTitle>
                    <span className="text-xs text-muted-foreground">{form.watch("images").length}/5</span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {form.watch("images").map((url, i) => (
                        <div key={i} className="aspect-square relative rounded-md overflow-hidden bg-muted group border">
                          <img src={url} alt="Product" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeImageUrl(i)}
                            className="absolute top-1 right-1 bg-destructive/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {form.watch("images").length < 5 && (
                        <button 
                          type="button" 
                          onClick={addImageUrl}
                          className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors hover:text-foreground hover:border-foreground/50"
                        >
                          <ImageIcon className="h-6 w-6 mb-2 opacity-50" />
                          <span className="text-xs font-medium">Add URL</span>
                        </button>
                      )}
                    </div>
                    {form.formState.errors.images?.message && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {form.formState.errors.images.message}
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Publishing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-primary/10 text-primary p-4 rounded-xl text-sm mb-4">
                      Products must be approved by an administrator before appearing on the public store.
                    </div>
                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isEditing ? 'Save Changes' : 'Submit for Review'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

            </div>
          </form>
        </Form>
      </div>
    </SellerLayout>
  );
}
