import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, BarChart3, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TC</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">TECLUB CRM</span>
          </Link>

          {role === 'gestor' && (
            <nav className="flex items-center gap-1">
              <Link to="/dashboard">
                <Button 
                  variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Link to="/leads/manage">
                <Button 
                  variant={location.pathname === '/leads/manage' ? 'secondary' : 'ghost'} 
                  size="sm"
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Leads</span>
                </Button>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
