import { useGetMe, useUpdateMe, useChangePassword, useGetAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, getGetMeQueryKey, getGetAddressesQueryKey } from "@/api";
import { useGetSellerProfile, useRegisterSeller } from "@/api";
import { uploadToImageKit } from "@/api/imagekit";
import { RootLayout } from "@/components/layout/RootLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { User, Key, MapPin, Plus, Trash2, Edit, Store, Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "wouter";

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const addressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4),
  country: z.string().min(2),
});

const sellerSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  description: z.string().optional(),
  gstNumber: z.string().optional(),
});

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const { data: addresses } = useGetAddresses();
  const updateMe = useUpdateMe();
  const changePassword = useChangePassword();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const { login, accessToken } = useAuth(); // Need login to update context user

  // Avatar upload state
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "", avatarUrl: "" },
  });

  const initialized = useRef(false);
  useEffect(() => {
    if (user && !initialized.current) {
      profileForm.reset({
        name: user.name,
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
      });
      initialized.current = true;
    }
  }, [user, profileForm]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    setAvatarUploading(true);
    try {
      const result = await uploadToImageKit(file, "/avatars");
      profileForm.setValue("avatarUrl", result.url, { shouldDirty: true });
      toast.success("Avatar uploaded — click Save Changes to apply");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  }

  function onProfileSubmit(values: z.infer<typeof profileSchema>) {
    updateMe.mutate({ data: values }, {
      onSuccess: (updatedUser) => {
        toast.success("Profile updated");
        queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
        // Also update AuthContext
        if (accessToken) {
          login({ accessToken, refreshToken: localStorage.getItem("shopx_refresh_token") || "" }, updatedUser);
        }
      },
      onError: () => toast.error("Failed to update profile")
    });
  }

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    changePassword.mutate({ data: { currentPassword: values.currentPassword, newPassword: values.newPassword } }, {
      onSuccess: () => {
        toast.success("Password changed successfully");
        passwordForm.reset();
      },
      onError: () => toast.error("Failed to change password. Please check your current password.")
    });
  }

  const addressForm = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "" },
  });

  const [isAddrModalOpen, setIsAddrModalOpen] = useState(false);

  function onAddressSubmit(values: z.infer<typeof addressSchema>) {
    createAddress.mutate({ data: values }, {
      onSuccess: () => {
        toast.success("Address added");
        setIsAddrModalOpen(false);
        addressForm.reset();
        queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() });
      },
      onError: () => toast.error("Failed to add address")
    });
  }

  // ── Become a Seller ──────────────────────────────────────────────────
  const isSellerRole = user?.role === "seller";
  const { data: sellerProfile, isLoading: isLoadingSellerProfile, isError: isSellerProfileError } = useGetSellerProfile({
    query: { enabled: isSellerRole, retry: false }
  });
  const registerSellerMutation = useRegisterSeller();

  const sellerForm = useForm<z.infer<typeof sellerSchema>>({
    resolver: zodResolver(sellerSchema),
    defaultValues: { storeName: "", description: "", gstNumber: "" },
  });

  function onSellerSubmit(values: z.infer<typeof sellerSchema>) {
    registerSellerMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        // Role just changed server-side, so refresh the session with the new token/role.
        login({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["sellers", "me"] });
        toast.success("Seller profile created! It's pending admin approval.");
      },
      onError: (error) => toast.error(error.message || "Failed to create seller profile")
    });
  }

  // Someone can complete seller onboarding if they're a buyer, or if their
  // account role is already "seller" but no Seller record exists yet
  // (e.g. an older account created before this flow existed).
  const needsSellerOnboarding =
    user?.role === "buyer" || (isSellerRole && isSellerProfileError && !isLoadingSellerProfile);

  return (
    <RootLayout>
      <div className="bg-muted/30 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Account Settings</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 w-full justify-start h-auto flex-wrap">
            <TabsTrigger value="profile" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <User className="mr-2 h-4 w-4" /> Profile Info
            </TabsTrigger>
            <TabsTrigger value="security" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Key className="mr-2 h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="addresses" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <MapPin className="mr-2 h-4 w-4" /> Addresses
            </TabsTrigger>
            {user?.role === "seller" && (
              <TabsTrigger value="seller" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Store className="mr-2 h-4 w-4" /> Seller
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 max-w-xl">
                    <div className="flex items-center gap-6 mb-8">
                      {/* Avatar preview */}
                      <div className="relative group cursor-pointer" onClick={() => !avatarUploading && avatarInputRef.current?.click()}>
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                          {profileForm.watch("avatarUrl") ? (
                            <img src={profileForm.watch("avatarUrl")} alt="Avatar" className={`w-full h-full object-cover ${avatarUploading ? "opacity-50" : ""}`} />
                          ) : (
                            <User className="h-10 w-10 text-primary" />
                          )}
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all">
                          {avatarUploading
                            ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                            : <Upload className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Profile Photo</p>
                        <p className="text-xs text-muted-foreground mb-3">Click the circle to upload a new photo (JPG, PNG, WEBP · max 5 MB)</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={avatarUploading}
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          {avatarUploading
                            ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Uploading…</>
                            : <><Upload className="mr-2 h-3.5 w-3.5" />Change Photo</>}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={updateMe.isPending}>Save Changes</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 max-w-xl">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl><Input type="password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl><Input type="password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl><Input type="password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={changePassword.isPending}>Update Password</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Saved Addresses</h3>
              <Dialog open={isAddrModalOpen} onOpenChange={setIsAddrModalOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4"/> Add New Address</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Add New Address</DialogTitle>
                  </DialogHeader>
                  <Form {...addressForm}>
                    <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={addressForm.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={addressForm.control} name="phone" render={({ field }) => (
                          <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>
                      <FormField control={addressForm.control} name="line1" render={({ field }) => (
                        <FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={addressForm.control} name="line2" render={({ field }) => (
                        <FormItem><FormLabel>Address Line 2 (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={addressForm.control} name="city" render={({ field }) => (
                          <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={addressForm.control} name="state" render={({ field }) => (
                          <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={addressForm.control} name="pincode" render={({ field }) => (
                          <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={addressForm.control} name="country" render={({ field }) => (
                          <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>
                      <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={createAddress.isPending}>Save Address</Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses?.length === 0 ? (
                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">You haven't saved any addresses yet.</p>
                </div>
              ) : (
                addresses?.map(addr => (
                  <Card key={addr.id} className="glass-card relative overflow-hidden group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                        if(confirm("Delete this address?")) {
                          deleteAddress.mutate({ id: addr.id }, {
                            onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() })
                          });
                        }
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{addr.name}</CardTitle>
                      <CardDescription>{addr.phone}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{addr.line1}</p>
                      {addr.line2 && <p className="text-sm">{addr.line2}</p>}
                      <p className="text-sm">{addr.city}, {addr.state} {addr.pincode}</p>
                      <p className="text-sm text-muted-foreground mt-1">{addr.country}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {user?.role === "seller" && (
            <TabsContent value="seller">
              <Card className="glass-card">
                {isLoadingSellerProfile ? (
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Loading seller profile...
                  </CardContent>
                ) : sellerProfile ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{sellerProfile.storeName}</CardTitle>
                          <CardDescription>Your seller profile on ShopX</CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            sellerProfile.status === "approved"
                              ? "border-green-600 text-green-600"
                              : sellerProfile.status === "rejected" || sellerProfile.status === "suspended"
                                ? "border-destructive text-destructive"
                                : "border-amber-500 text-amber-500"
                          }
                        >
                          {sellerProfile.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sellerProfile.status === "pending" && (
                        <p className="text-sm text-muted-foreground">
                          Your store is awaiting admin approval. You can still add products from your seller dashboard in the meantime.
                        </p>
                      )}
                      {sellerProfile.description && <p className="text-sm">{sellerProfile.description}</p>}
                      <Link href="/seller/dashboard">
                        <Button>Go to Seller Dashboard</Button>
                      </Link>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Seller profile not found. Please contact an administrator to set up your store.
                  </CardContent>
                )}
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </RootLayout>
  );
}
