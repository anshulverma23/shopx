import { useGetProduct, useCreateProduct, useUpdateProduct, useListCategories, useListBrands } from "@/api";
import { uploadToImageKit } from "@/api/imagekit";
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
import { ArrowLeft, Loader2, X, Upload, ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_IMAGES = 5;

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
  images: z.array(z.string()).max(MAX_IMAGES, `Maximum ${MAX_IMAGES} images allowed`),
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

type FormValues = z.infer<typeof schema>;

interface UploadingImage {
  id: string;
  name: string;
  progress: number;
  previewUrl: string;
}

export default function ProductForm() {
  const [, setLocation] = useLocation();

  // Edit route: /seller/products/:id/edit
  const [editMatch, editParams] = useRoute("/seller/products/:id/edit");
  // New route: /seller/products/new
  const [newMatch] = useRoute("/seller/products/new");

  const isEditing = editMatch && !!editParams?.id;
  const productId = isEditing ? editParams!.id : null;

  const { data: product, isLoading: isLoadingProduct } = useGetProduct(
    productId ?? undefined,
    { query: { enabled: !!productId } }
  );
  const { data: categories } = useListCategories();
  const { data: brands } = useListBrands();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // Track in-progress uploads so we can show a spinner per slot
  const [uploading, setUploading] = useState<UploadingImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      discountPrice: null,
      stock: 0,
      images: [],
      tags: [],
      specifications: {},
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
        specifications: (product as any).specifications || {},
      });
    }
  }, [product, isEditing, form]);

  const onSubmit = (values: FormValues) => {
    if (uploading.length > 0) {
      toast.error("Please wait for all images to finish uploading");
      return;
    }
    if (isEditing && productId) {
      updateMutation.mutate({ id: productId, data: values }, {
        onSuccess: () => {
          toast.success("Product updated successfully");
          setLocation("/seller/products");
        },
        onError: (err) => toast.error(err.message || "Failed to update product"),
      });
    } else {
      createMutation.mutate({ data: values as any }, {
        onSuccess: () => {
          toast.success("Product created successfully");
          setLocation("/seller/products");
        },
        onError: (err) => toast.error(err.message || "Failed to create product"),
      });
    }
  };

  // Handle file selection (supports multiple files at once)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Reset input so the same file can be re-selected after removal
    if (fileInputRef.current) fileInputRef.current.value = "";

    const currentImages = form.getValues("images");
    const available = MAX_IMAGES - currentImages.length - uploading.length;

    if (files.length > available) {
      toast.error(`You can only add ${available} more image${available === 1 ? "" : "s"}`);
      return;
    }

    // Start all uploads concurrently
    await Promise.all(
      files.slice(0, available).map(async (file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(`"${file.name}" is not an image file`);
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`"${file.name}" exceeds the 10 MB limit`);
          return;
        }

        const id = `${Date.now()}-${Math.random()}`;
        const previewUrl = URL.createObjectURL(file);

        // Add placeholder slot with 0% progress
        setUploading((prev) => [...prev, { id, name: file.name, progress: 0, previewUrl }]);

        try {
          const result = await uploadToImageKit(file, "/products", (pct) => {
            setUploading((prev) =>
              prev.map((u) => (u.id === id ? { ...u, progress: pct } : u))
            );
          });

          // Upload done — move URL into form
          form.setValue("images", [...form.getValues("images"), result.url], {
            shouldValidate: true,
            shouldDirty: true,
          });
          toast.success(`"${file.name}" uploaded`);
        } catch (err: any) {
          toast.error(err.message || `Failed to upload "${file.name}"`);
        } finally {
          URL.revokeObjectURL(previewUrl);
          setUploading((prev) => prev.filter((u) => u.id !== id));
        }
      })
    );
  };

  const removeImage = (index: number) => {
    const images = form.getValues("images");
    form.setValue("images", images.filter((_, i) => i !== index), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const totalSlots = form.watch("images").length + uploading.length;

  if (!newMatch && isEditing && isLoadingProduct) {
    return (
      <SellerLayout>
        <div className="p-24 text-center flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading product data…</span>
        </div>
      </SellerLayout>
    );
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
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? "Edit Product" : "New Product"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Update product details and pricing" : "Add a new product to your store"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* ── Left column: basic info + pricing ── */}
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
                          <FormControl>
                            <Input placeholder="e.g. Wireless Noise-Cancelling Headphones" {...field} />
                          </FormControl>
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
                            <Textarea placeholder="Describe the product…" className="h-32" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-6">
                      {/* Category */}
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={(val) => field.onChange(val || undefined)}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Brand */}
                      <FormField
                        control={form.control}
                        name="brandId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <Select
                              onValueChange={(val) => field.onChange(val || undefined)}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select brand" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {brands?.map((b) => (
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
                    <CardTitle>Pricing &amp; Inventory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Regular Price (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} />
                            </FormControl>
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
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Optional"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value !== "" ? Number(e.target.value) : null)
                                }
                              />
                            </FormControl>
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
                            <FormControl>
                              <Input type="number" min="0" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── Right column: images + publish ── */}
              <div className="lg:col-span-1 space-y-8">
                {/* Images */}
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Product Images</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {totalSlots}/{MAX_IMAGES}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Hidden real file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      {/* Confirmed uploaded images */}
                      {form.watch("images").map((url, i) => (
                        <div
                          key={url}
                          className="aspect-square relative rounded-lg overflow-hidden bg-muted group border border-border"
                        >
                          <img
                            src={url}
                            alt={`Product image ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1.5 right-1.5 bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive shadow-sm"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {i === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}

                      {/* In-progress upload slots */}
                      {uploading.map((u) => (
                        <div
                          key={u.id}
                          className="aspect-square relative rounded-lg overflow-hidden bg-muted border border-border"
                        >
                          <img
                            src={u.previewUrl}
                            alt="Uploading…"
                            className="w-full h-full object-cover opacity-50"
                          />
                          {/* Progress overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
                            <Loader2 className="h-5 w-5 animate-spin text-white" />
                            <span className="text-xs text-white font-semibold">{u.progress}%</span>
                          </div>
                          {/* Progress bar at bottom */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                            <div
                              className="h-full bg-primary transition-all duration-200"
                              style={{ width: `${u.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Add more button (shown when slots remain) */}
                      {totalSlots < MAX_IMAGES && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 hover:border-primary/50 hover:text-primary transition-all group"
                        >
                          <Upload className="h-6 w-6 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                          <span className="text-[11px] font-medium">Upload Image</span>
                          <span className="text-[10px] opacity-60 mt-0.5">JPG, PNG, WEBP</span>
                        </button>
                      )}

                      {/* Empty state placeholder when no images yet */}
                      {totalSlots === 0 && (
                        <div className="col-span-2 flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                          <ImageIcon className="h-10 w-10 opacity-30" />
                          <p className="text-sm">No images yet</p>
                          <p className="text-xs opacity-70">Click "Upload Image" above to add photos</p>
                        </div>
                      )}
                    </div>

                    {form.formState.errors.images?.message && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {form.formState.errors.images.message}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Max {MAX_IMAGES} images · 10 MB each · First image is the cover photo
                    </p>
                  </CardContent>
                </Card>

                {/* Publishing */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Publishing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-primary/10 text-primary p-4 rounded-xl text-sm">
                      Products must be approved by an administrator before appearing on the public store.
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isPending || uploading.length > 0}
                    >
                      {(isPending || uploading.length > 0) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {uploading.length > 0
                        ? `Uploading ${uploading.length} image${uploading.length > 1 ? "s" : ""}…`
                        : isEditing
                          ? "Save Changes"
                          : "Submit for Review"}
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
