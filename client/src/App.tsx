import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Orders from '@/pages/Orders';
import Wishlist from '@/pages/Wishlist';
import SellerDashboard from '@/pages/seller/Dashboard';
import SellerProducts from '@/pages/seller/Products';
import SellerOrders from '@/pages/seller/Orders';
import ProductForm from '@/pages/seller/ProductForm';
import SellerSettings from '@/pages/seller/Settings';

import AdminDashboard from '@/pages/admin/Dashboard';
import AdminUsers from '@/pages/admin/Users';
import AdminSellers from '@/pages/admin/Sellers';
import AdminProducts from '@/pages/admin/Products';
import AdminCategories from '@/pages/admin/Categories';
import AdminCoupons from '@/pages/admin/Coupons';
import AdminOrders from '@/pages/admin/Orders';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import VerifyOtp from '@/pages/auth/VerifyOtp';
import Profile from '@/pages/Profile';
import OrderDetail from '@/pages/OrderDetail';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ component: Component, roles }: { component: React.ComponentType<any>, roles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation('/auth/login');
      } else if (roles && !roles.includes(user.role)) {
        setLocation('/');
      }
    }
  }, [user, isLoading, roles, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || (roles && !roles.includes(user.role))) {
    return null; // Will redirect in useEffect
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/verify-otp" component={VerifyOtp} />
      
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/cart" component={() => <ProtectedRoute component={Cart} />} />
      <Route path="/checkout" component={() => <ProtectedRoute component={Checkout} />} />
      <Route path="/orders" component={() => <ProtectedRoute component={Orders} />} />
      <Route path="/orders/:id" component={() => <ProtectedRoute component={OrderDetail} />} />
      <Route path="/wishlist" component={() => <ProtectedRoute component={Wishlist} />} />
      <Route path="/seller/dashboard" component={() => <ProtectedRoute component={SellerDashboard} roles={["seller", "admin"]} />} />
      <Route path="/seller/products" component={() => <ProtectedRoute component={SellerProducts} roles={["seller", "admin"]} />} />
      <Route path="/seller/products/new" component={() => <ProtectedRoute component={ProductForm} roles={["seller", "admin"]} />} />
      <Route path="/seller/products/:id/edit" component={() => <ProtectedRoute component={ProductForm} roles={["seller", "admin"]} />} />
      <Route path="/seller/orders" component={() => <ProtectedRoute component={SellerOrders} roles={["seller", "admin"]} />} />
      <Route path="/seller/settings" component={() => <ProtectedRoute component={SellerSettings} roles={["seller", "admin"]} />} />
      
      <Route path="/admin/dashboard" component={() => <ProtectedRoute component={AdminDashboard} roles={["admin"]} />} />
      <Route path="/admin/users" component={() => <ProtectedRoute component={AdminUsers} roles={["admin"]} />} />
      <Route path="/admin/sellers" component={() => <ProtectedRoute component={AdminSellers} roles={["admin"]} />} />
      <Route path="/admin/products" component={() => <ProtectedRoute component={AdminProducts} roles={["admin"]} />} />
      <Route path="/admin/categories" component={() => <ProtectedRoute component={AdminCategories} roles={["admin"]} />} />
      <Route path="/admin/coupons" component={() => <ProtectedRoute component={AdminCoupons} roles={["admin"]} />} />
      <Route path="/admin/orders" component={() => <ProtectedRoute component={AdminOrders} roles={["admin"]} />} />
      
      {/* Fallback for anything else during dev */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const content = (
    <ThemeProvider defaultTheme="light" storageKey="shopx-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );

  // Google Sign-In only works once VITE_GOOGLE_CLIENT_ID is configured (see client/.env.example).
  // Without it, the app still runs fine — the Google button simply doesn't render (see GoogleAuthButton.tsx).
  if (!GOOGLE_CLIENT_ID) return content;

  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>;
}

export default App;
