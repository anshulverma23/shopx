import { useAdminListCategories, useAdminCreateCategory, useAdminDeleteCategory, getAdminListCategoriesQueryKey } from "@/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tags, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal(''))
});

export default function AdminCategories() {
  const { data, isLoading } = useAdminListCategories();
  const createCategory = useAdminCreateCategory();
  const deleteCategory = useAdminDeleteCategory();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", description: "", imageUrl: "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    createCategory.mutate({ data: values }, {
      onSuccess: () => {
        toast.success("Category created");
        setIsOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() });
      },
      onError: () => toast.error("Failed to create category")
    });
  };

  const handleDelete = (id: string) => {
    if(confirm("Are you sure? This cannot be undone.")) {
      deleteCategory.mutate({ id }, {
        onSuccess: () => {
          toast.success("Category deleted");
          queryClient.invalidateQueries({ queryKey: getAdminListCategoriesQueryKey() });
        },
        onError: () => toast.error("Failed to delete category")
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Tags className="h-8 w-8 text-primary"/> Categories</h1>
            <p className="text-muted-foreground">Manage product taxonomy.</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4"/> Create Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug</FormLabel><FormControl><Input placeholder="e.g. smart-home" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="imageUrl" render={({ field }) => (
                    <FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end"><Button type="submit" disabled={createCategory.isPending}>Save</Button></div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />)
          ) : data?.map(cat => (
            <div key={cat.id} className="bg-card border rounded-2xl overflow-hidden group relative">
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(cat.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-32 bg-muted relative">
                {cat.imageUrl && <img src={cat.imageUrl} alt="" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <h3 className="text-white font-bold text-2xl">{cat.name}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-mono text-muted-foreground mb-2">/{cat.slug}</p>
                {cat.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{cat.description}</p>}
                <div className="text-sm font-medium">{cat.productCount} Products</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
