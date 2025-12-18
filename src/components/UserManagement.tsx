import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { UserCog } from 'lucide-react';
import { AppRole } from '@/types/database';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('full_name');

    if (profiles) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || null,
        };
      });

      setUsers(usersWithRoles);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdating(userId);
    
    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let error;
    
    if (existingRole) {
      // Update existing role
      const result = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
      error = result.error;
    } else {
      // Insert new role
      const result = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });
      error = result.error;
    }

    if (error) {
      toast.error('Erro ao atualizar permissão');
    } else {
      toast.success('Permissão atualizada');
      fetchUsers();
    }
    
    setUpdating(null);
  };

  const getRoleBadge = (role: AppRole | null) => {
    if (!role) {
      return <Badge variant="outline" className="text-amber-600 border-amber-300">Sem permissão</Badge>;
    }
    if (role === 'gestor') {
      return <Badge className="bg-accent text-accent-foreground">Gestor</Badge>;
    }
    return <Badge variant="secondary">Vendedor</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Gerenciar Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          Gerenciar Usuários
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {user.full_name || 'Sem nome'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  {getRoleBadge(user.role)}
                  
                  <Select
                    value={user.role || 'none'}
                    onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}