import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@/api";
import type { User } from "@/api";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Package, ArrowRight, Loader2 } from "lucide-react";
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

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function redirectByRole(user: User) {
    if (user.role === "admin") {
      setLocation("/admin/dashboard");
    } else if (user.role === "seller") {
      setLocation("/seller/dashboard");
    } else {
      setLocation("/");
    }
  }

  function onSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          login(
            { accessToken: data.accessToken, refreshToken: data.refreshToken },
            data.user,
          );
          toast.success("Welcome back!");
          redirectByRole(data.user);
        },
        onError: () => {
          toast.error("Invalid email or password");
        },
      },
    );
  }

  function onGoogleSuccess(user: User) {
    toast.success("Welcome back!");
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
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Or{" "}
              <Link
                href="/auth/register"
                className="font-medium text-primary hover:underline"
              >
                Create an account
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
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/auth/forgot-password"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Forgot your password?
                        </Link>
                      </div>
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

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
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
                >
                  {loginMutation.isPending && (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  )}
                  {loginMutation.isPending ? "Signing in..." : "Log in"}
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

            <GoogleAuthButton onSuccess={onGoogleSuccess} />
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent flex items-end p-12">
          <div className="text-white max-w-xl">
            <h3 className="text-3xl font-bold mb-4">
              "The premier destination for discovering new brands and products."
            </h3>
            <p className="text-lg opacity-80">— Vogue Magazine</p>
          </div>
        </div>
      </div>
    </div>
  );
}
