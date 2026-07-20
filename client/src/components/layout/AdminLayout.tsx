import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  Tags,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeProvider } from "@/components/theme-provider";

interface SidebarProps {
  isAdmin?: boolean;
}

function SidebarNav({ isAdmin }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const sellerLinks = [
    { href: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/seller/products", label: "Products", icon: Package },
    { href: "/seller/orders", label: "Orders", icon: ShoppingCart },
    { href: "/seller/settings", label: "Store Settings", icon: Settings },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/sellers", label: "Sellers", icon: StoreIcon },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  ];

  const links = isAdmin ? adminLinks : sellerLinks;

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-50 border-r border-slate-800 w-full">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80">
          <Package className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl tracking-tight">ShopX {isAdmin ? 'Admin' : 'Seller'}</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || location.startsWith(link.href + "/");
          return (
            <Link key={link.href} href={link.href}>
              <div className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${
                isActive 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}>
                <Icon className="h-5 w-5" />
                {link.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-primary font-bold overflow-hidden border border-slate-700">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user?.name || "User"} className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}

// Create a dummy component since we used StoreIcon above but didn't import it
const StoreIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 7 4.41-2.205a2 2 0 0 1 1.79 0L12 7l3.8-1.9a2 2 0 0 1 1.79 0L22 7v14H2V7Z"/><path d="M16 11v6"/><path d="M12 11v6"/><path d="M8 11v6"/></svg>
);

export function AdminLayout({ children, isAdmin = true }: { children: React.ReactNode, isAdmin?: boolean }) {
  return (
    <div className="min-h-[100dvh] flex bg-muted/40">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 fixed inset-y-0 z-50">
        <SidebarNav isAdmin={isAdmin} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-0">
              <SidebarNav isAdmin={isAdmin} />
            </SheetContent>
          </Sheet>
          <div className="flex flex-1 items-center justify-end gap-x-4 self-stretch lg:gap-x-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              View Store
            </Link>
          </div>
        </header>

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function SellerLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout isAdmin={false}>{children}</AdminLayout>;
}
