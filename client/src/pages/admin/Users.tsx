import { useAdminListUsers, useAdminUpdateUserStatus, getAdminListUsersQueryKey } from "@/api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Ban, CheckCircle2, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const { data, isLoading } = useAdminListUsers({
    q: search || undefined, role: (roleFilter === "all" ? undefined : roleFilter) as any
  });
  
  const updateStatus = useAdminUpdateUserStatus();
  const queryClient = useQueryClient();

  const handleStatusUpdate = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "banned" : "active";
    if(confirm(`Are you sure you want to ${newStatus === 'banned' ? 'ban' : 'activate'} this user?`)) {
      updateStatus.mutate({ id: userId, data: { status: newStatus } }, {
        onSuccess: () => {
          toast.success(`User ${newStatus === 'banned' ? 'banned' : 'activated'} successfully`);
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey({}) });
        },
        onError: () => toast.error("Failed to update user status")
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage platform users, sellers, and administrators.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="buyer">Buyers</SelectItem>
              <SelectItem value="seller">Sellers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-12 px-6 text-left align-middle font-medium">User</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Role</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Status</th>
                  <th className="h-12 px-6 text-left align-middle font-medium">Joined</th>
                  <th className="h-12 px-6 text-right align-middle font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={5} className="h-24 text-center">Loading...</td></tr>
                ) : data?.users?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="h-48 text-center text-muted-foreground">No users found.</td>
                  </tr>
                ) : (
                  data?.users?.map((user) => (
                    <tr key={user.id} className="border-b transition-colors hover:bg-muted/30">
                      <td className="p-6 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full rounded-full object-cover"/> : <UserIcon className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 align-middle">
                        <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'seller' ? 'default' : 'secondary'} className="capitalize">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-6 align-middle">
                        <Badge variant={user.status === 'banned' ? 'destructive' : 'outline'} className="capitalize bg-background">
                          {user.status || 'Active'}
                        </Badge>
                      </td>
                      <td className="p-6 align-middle text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-6 align-middle text-right">
                        {user.role !== 'admin' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className={user.status === 'banned' ? 'text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900' : 'text-destructive hover:bg-destructive/10'}
                            onClick={() => handleStatusUpdate(user.id, user.status || 'active')}
                          >
                            {user.status === 'banned' ? <><CheckCircle2 className="mr-2 h-4 w-4"/> Unban</> : <><Ban className="mr-2 h-4 w-4"/> Ban</>}
                          </Button>
                        )}
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
