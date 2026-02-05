import { ReactNode } from 'react';
import { useIsCallerAdmin, useIsAdminLoggedIn } from '../../hooks/useQueries';
import AccessDeniedScreen from './AccessDeniedScreen';

interface RequireAdminProps {
  children: ReactNode;
}

export default function RequireAdmin({ children }: RequireAdminProps) {
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsCallerAdmin();
  const { data: isAdminLoggedIn, isLoading: isLoadingSession } = useIsAdminLoggedIn();

  const isLoading = isLoadingAdmin || isLoadingSession;
  const hasAdminAccess = isAdmin || isAdminLoggedIn;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return <AccessDeniedScreen />;
  }

  return <>{children}</>;
}
