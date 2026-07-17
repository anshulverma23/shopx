import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForgotPassword } from "@/api";
import { toast } from "sonner";
import { Package, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const mutation = useForgotPassword();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: z.infer<typeof schema>) {
    mutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast.success("Password reset instructions sent to your email.");
          form.reset();
        },
        onError: () => {
          toast.error("Something went wrong. Please try again.");
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-muted/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:opacity-80 mx-auto">
          <Package className="h-8 w-8" />
          <span className="font-bold text-2xl tracking-tight">ShopX</span>
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight">Forgot password?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-2xl sm:px-10 border">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
