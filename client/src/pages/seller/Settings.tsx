import { useGetSellerProfile, useUpdateSellerProfile } from "@/api/sellers";
import { SellerLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useEffect } from "react";

const sellerSettingsSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  description: z.string().optional(),
  gstNumber: z.string().optional(),
});

export default function SellerSettings() {
  const { data: sellerProfile, isLoading } = useGetSellerProfile();
  const updateSellerMutation = useUpdateSellerProfile();

  const form = useForm<z.infer<typeof sellerSettingsSchema>>({
    resolver: zodResolver(sellerSettingsSchema),
    defaultValues: { storeName: "", description: "", gstNumber: "" },
  });

  useEffect(() => {
    if (sellerProfile) {
      form.reset({
        storeName: sellerProfile.storeName,
        description: sellerProfile.description || "",
        gstNumber: sellerProfile.gstNumber || "",
      });
    }
  }, [sellerProfile, form]);

  function onSubmit(values: z.infer<typeof sellerSettingsSchema>) {
    updateSellerMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast.success("Store settings updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update store settings");
      }
    });
  }

  if (isLoading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center h-full">Loading settings...</div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Store Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your store details and public information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Store Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateSellerMutation.isPending}>
                  {updateSellerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </SellerLayout>
  );
}
