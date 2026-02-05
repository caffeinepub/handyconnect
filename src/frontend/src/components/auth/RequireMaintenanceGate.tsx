import { ReactNode } from 'react';
import { useIsMaintenanceMode, useIsCallerAdmin } from '../../hooks/useQueries';
import MaintenanceScreen from '../maintenance/MaintenanceScreen';

interface RequireMaintenanceGateProps {
  children: ReactNode;
}

export default function RequireMaintenanceGate({ children }: RequireMaintenanceGateProps) {
  const { data: isMaintenanceMode, isLoading: maintenanceLoading } = useIsMaintenanceMode();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  if (maintenanceLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If maintenance mode is enabled and user is not admin, show maintenance screen
  if (isMaintenanceMode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
}
