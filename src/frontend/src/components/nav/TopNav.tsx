import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useAccountType } from '../../hooks/useAccountType';
import { useIsCallerAdmin, useIsAdminLoggedIn, useLogOutAdmin } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Menu, X, Briefcase, User, Home, Shield } from 'lucide-react';
import { useState } from 'react';

export default function TopNav() {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const { accountType } = useAccountType();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: isAdminLoggedIn } = useIsAdminLoggedIn();
  const logOutAdmin = useLogOutAdmin();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!identity;
  const hasAdminAccess = isAdmin || isAdminLoggedIn;

  const handleLogout = async () => {
    // If logged in via credentials, call backend logout
    if (isAdminLoggedIn) {
      try {
        await logOutAdmin.mutateAsync();
      } catch (error) {
        console.error('Error logging out admin:', error);
      }
    }
    
    // Always clear Internet Identity session and cache
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  const navLinks = accountType === 'client' 
    ? [
        { to: '/app/browse', label: 'Browse Workers', icon: Home },
        { to: '/app/client/dashboard', label: 'My Bookings', icon: Briefcase },
      ]
    : accountType === 'worker'
    ? [
        { to: '/app/browse', label: 'Browse Workers', icon: Home },
        { to: '/app/worker/dashboard', label: 'My Bookings', icon: Briefcase },
        { to: '/app/worker/profile', label: 'My Profile', icon: User },
      ]
    : [];

  // Add admin link if user has admin access
  const allNavLinks = hasAdminAccess 
    ? [...navLinks, { to: '/app/admin', label: 'Admin', icon: Shield }]
    : navLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/app/browse" className="flex items-center space-x-3">
            <img 
              src="/assets/generated/handyconnect-logo.dim_512x512.png" 
              alt="HandyConnect" 
              className="h-10 w-10"
            />
            <span className="font-display text-xl font-bold text-primary">HandyConnect</span>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1">
              {allNavLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
                    activeProps={{ className: 'bg-accent text-foreground' }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Desktop Auth Button */}
          <div className="hidden md:block">
            {isAuthenticated && (
              <Button
                onClick={handleLogout}
                variant="outline"
                disabled={loginStatus === 'logging-in' || logOutAdmin.isPending}
              >
                {logOutAdmin.isPending ? 'Signing out...' : 'Sign Out'}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          {isAuthenticated && (
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-2 border-t">
            {allNavLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
                  activeProps={{ className: 'bg-accent text-foreground' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <div className="px-4 pt-2">
              <Button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                variant="outline"
                className="w-full"
                disabled={loginStatus === 'logging-in' || logOutAdmin.isPending}
              >
                {logOutAdmin.isPending ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
