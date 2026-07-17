import { useAdminListCoupons, useAdminCreateCoupon, getAdminListCouponsQueryKey } from "@/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Ticket, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const schema = z.object({
  code: z.string().min(3).toUpperCase(),
  discountType: z.enum(["percent", "flat"]),
  discountValue: z.coerce.number().positive(),
  minOrder: z.coerce.number().optional(),
  maxDiscount: z.coerce.number().optional(),
  expiresAt: z.string().optional() // keeping it string for datetime-local input
});

export default function AdminCoupons() {
  const { data, isLoading } = useAdminListCoupons();
  const createCoupon = useAdminCreateCoupon();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", discountType: "percent" as const, discountValue: 0 },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    const payload = {
      ...values,
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined
    };
    
    createCoupon.mutate({ data: payload as any }, {
      onSuccess: () => {
        toast.success("Coupon created");
        setIsOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getAdminListCouponsQueryKey() });
      },
      onError: () => toast.error("Failed to create coupon")
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Ticket className="h-8 w-8 text-primary"/> Discount Coupons</h1>
            <p className="text-muted-foreground">Create and manage promotional codes.</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4"/> New Coupon</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Promotion</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="code" render={({ field }) => (
                    <FormItem><FormLabel>Coupon Code</FormLabel><FormControl><Input placeholder="SUMMER20" {...field} className="uppercase" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="discountType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="percent">Percentage (%)</SelectItem>
                            <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="discountValue" render={({ field }) => (
                      <FormItem><FormLabel>Value</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="minOrder" render={({ field }) => (
                      <FormItem><FormLabel>Min Order (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="maxDiscount" render={({ field }) => (
                      <FormItem><FormLabel>Max Discount (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="expiresAt" render={({ field }) => (
                    <FormItem><FormLabel>Expiry Date (Optional)</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end pt-2"><Button type="submit" disabled={createCoupon.isPending}>Generate Coupon</Button></div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-12 px-6 text-left align-middle font-medium">Code</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Discount</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Conditions</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Status</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Expires</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={5} className="h-24 text-center">Loading...</td></tr>
                ) : data?.length === 0 ? (
                  <tr><td colSpan={5} className="h-48 text-center text-muted-foreground">No coupons found.</td></tr>
                ) : (
                  data?.map((coupon) => (
                    <tr key={coupon.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="p-6 align-middle font-mono font-bold text-lg text-primary">{coupon.code}</td>
                      <td className="p-6 align-middle font-medium text-lg">
                        {coupon.discountType === 'percent' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                      </td>
                      <td className="p-6 align-middle text-muted-foreground text-xs space-y-1">
                        {coupon.minOrder && <div>Min: ₹{coupon.minOrder}</div>}
                        {coupon.maxDiscount && <div>Max Cap: ₹{coupon.maxDiscount}</div>}
                        {!coupon.minOrder && !coupon.maxDiscount && "None"}
                      </td>
                      <td className="p-6 align-middle">
                        <Badge variant={coupon.isActive ? 'default' : 'secondary'}>{coupon.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="p-6 align-middle text-muted-foreground">
                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
