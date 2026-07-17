import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister, useRegisterSeller } from "@/api";
import type { User } from "@/api";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Package, Loader2 } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["buyer", "seller"]),
    storeName: z.string().optional(),
  })
  .refine((data) => data.role !== "seller" || !!data.storeName?.trim(), {
    message: "Store name is required to sell on ShopX",
    path: ["storeName"],
  });

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const registerMutation = useRegister();
  const registerSellerMutation = useRegisterSeller();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "buyer" as const,
      storeName: "",
    },
  });

  const selectedRole = form.watch("role");

  function redirectByRole(user: User) {
    if (user.role === "seller") {
      setLocation("/seller/dashboard");
    } else {
      setLocation("/");
    }
  }

  function onSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate(
      { data: { name: values.name, email: values.email, password: values.password, role: values.role } },
      {
        onSuccess: (data) => {
          login(
            { accessToken: data.accessToken, refreshToken: data.refreshToken },
            data.user,
          );

          if (values.role === "seller" && values.storeName) {
            registerSellerMutation.mutate(
              { data: { storeName: values.storeName } },
              {
                onSuccess: (sellerData) => {
                  login({ accessToken: sellerData.accessToken, refreshToken: sellerData.refreshToken }, sellerData.user);
                  toast.success("Account created — your seller profile is pending approval.");
                  redirectByRole(sellerData.user);
                },
                onError: () => {
                  toast.error("Account created, but we couldn't set up your seller profile. You can retry from your profile page.");
                  setLocation("/profile");
                },
              }
            );
            return;
          }

          toast.success("Account created successfully!");
          redirectByRole(data.user);
        },
        onError: () => {
          toast.error("Failed to create account. Email might be taken.");
        },
      },
    );
  }

  function onGoogleSuccess(user: User) {
    const storeName = form.getValues("storeName")?.trim();

    if (user.role === "seller" && storeName) {
      registerSellerMutation.mutate(
        { data: { storeName } },
        {
          onSuccess: (sellerData) => {
            login({ accessToken: sellerData.accessToken, refreshToken: sellerData.refreshToken }, sellerData.user);
            toast.success("Account created — your seller profile is pending approval.");
            redirectByRole(sellerData.user);
          },
          onError: () => {
            toast.success("Welcome!");
            redirectByRole(user);
          },
        }
      );
      return;
    }

    if (user.role === "seller" && !storeName) {
      toast.success("Account created! Add a store name from your profile to finish setting up your seller account.");
      setLocation("/profile");
      return;
    }

    toast.success("Account created successfully!");
    redirectByRole(user);
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-primary hover:opacity-80"
            >
              <Package className="h-8 w-8" />
              <span className="font-bold text-2xl tracking-tight">ShopX</span>
            </Link>
            <h2 className="mt-8 text-3xl font-extrabold tracking-tight">
              Create an account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>I want to...</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-full cursor-pointer hover:bg-muted/50">
                            <FormControl>
                              <RadioGroupItem value="buyer" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                              Shop for products
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-full cursor-pointer hover:bg-muted/50">
                            <FormControl>
                              <RadioGroupItem value="seller" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                              Sell on ShopX
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedRole === "seller" && (
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Awesome Store" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="
                  w-full
                   h-12
    rounded-full
    bg-[#1666D9]
    hover:bg-[#0F5ACF]
    text-white
    font-medium
    text-base
    shadow-none
    transition-all
    duration-200
    disabled:opacity-70
    disabled:cursor-not-allowed
    flex
    items-center
    justify-center
    border
    border-transparent
    focus:outline-none
  "
                  disabled={registerMutation.isPending || registerSellerMutation.isPending}
                >
                  {(registerMutation.isPending || registerSellerMutation.isPending) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create Account
                </Button>
              </form>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm ">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <GoogleAuthButton onSuccess={onGoogleSuccess} role={selectedRole} />
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent flex items-end p-12">
          <div className="text-white max-w-xl">
            <h3 className="text-3xl font-bold mb-4">
              Join millions of shoppers and sellers.
            </h3>
            <p className="text-lg opacity-80">
              Whether you're looking for the next big thing or building your own
              brand, ShopX is the place to be.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
