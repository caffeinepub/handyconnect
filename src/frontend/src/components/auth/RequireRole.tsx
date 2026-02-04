import { ReactNode } from 'react';
import { useAccountType } from '../../hooks/useAccountType';
import { Navigate } from '@tanstack/react-router';
import { AccountType } from '../../backend';

interface RequireRoleProps {
  children: ReactNode;
  role: AccountType;
}

export default function RequireRole({ children, role }: RequireRoleProps) {
  const { accountType, isLoading } = useAccountType();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (accountType !== role) {
    // Redirect to appropriate dashboard
    const redirectPath = accountType === AccountType.client ? '/app/client/dashboard' : '/app/worker/dashboard';
    return <Navigate to={redirectPath} />;
  }

  return <>{children}</>;
}
