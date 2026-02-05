import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Pages
import SignIn from './pages/SignIn';
import AdminSignIn from './pages/AdminSignIn';
import OnboardingAccountType from './pages/OnboardingAccountType';
import BrowseWorkers from './pages/BrowseWorkers';
import WorkerDetail from './pages/WorkerDetail';
import WorkerProfile from './pages/WorkerProfile';
import ClientDashboard from './pages/ClientDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import BookingDetail from './pages/BookingDetail';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import AdminDashboard from './pages/AdminDashboard';
import SubscriptionPaywall from './pages/SubscriptionPaywall';

// Guards
import RequireAuth from './components/auth/RequireAuth';
import RequireAccountType from './components/auth/RequireAccountType';
import RequireRole from './components/auth/RequireRole';
import RequireAdmin from './components/auth/RequireAdmin';
import RequireMaintenanceGate from './components/auth/RequireMaintenanceGate';

// Layout
import AppShell from './components/layout/AppShell';

import { AccountType } from './backend';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on subscription payment errors
        if (error?.message?.includes('Subscription payment required')) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

// Global error handler component
function GlobalErrorHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleError = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      if (error?.message?.includes('Subscription payment required') || 
          error?.message?.includes('Grace period has expired')) {
        event.preventDefault();
        toast.error('Subscription payment required to continue');
        navigate({ to: '/subscription-paywall' });
      }
    };

    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, [navigate]);

  return null;
}

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <GlobalErrorHandler />
      <Outlet />
      <Toaster />
    </ThemeProvider>
  ),
});

// Public routes
const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: SignIn,
});

const adminSignInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin-signin',
  component: AdminSignIn,
});

// Onboarding route (requires auth but not account type)
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: () => (
    <RequireAuth>
      <OnboardingAccountType />
    </RequireAuth>
  ),
});

// Payment routes
const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-success',
  component: () => (
    <RequireAuth>
      <PaymentSuccess />
    </RequireAuth>
  ),
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-failure',
  component: () => (
    <RequireAuth>
      <PaymentFailure />
    </RequireAuth>
  ),
});

// Subscription paywall route
const subscriptionPaywallRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/subscription-paywall',
  component: () => (
    <RequireAuth>
      <RequireAccountType>
        <SubscriptionPaywall />
      </RequireAccountType>
    </RequireAuth>
  ),
});

// Protected routes with layout and maintenance gate
const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: () => (
    <RequireAuth>
      <RequireAccountType>
        <RequireMaintenanceGate>
          <AppShell>
            <Outlet />
          </AppShell>
        </RequireMaintenanceGate>
      </RequireAccountType>
    </RequireAuth>
  ),
});

// Browse workers (accessible to both roles)
const browseWorkersRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/browse',
  component: BrowseWorkers,
});

// Worker detail (accessible to both roles)
const workerDetailRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/worker/$workerId',
  component: WorkerDetail,
});

// Client dashboard
const clientDashboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/client/dashboard',
  component: () => (
    <RequireRole role={AccountType.client}>
      <ClientDashboard />
    </RequireRole>
  ),
});

// Worker dashboard
const workerDashboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/worker/dashboard',
  component: () => (
    <RequireRole role={AccountType.worker}>
      <WorkerDashboard />
    </RequireRole>
  ),
});

// Worker profile
const workerProfileRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/worker/profile',
  component: () => (
    <RequireRole role={AccountType.worker}>
      <WorkerProfile />
    </RequireRole>
  ),
});

// Booking detail (accessible to both roles, backend enforces access)
const bookingDetailRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: '/booking/$bookingId',
  component: BookingDetail,
});

// Admin dashboard (requires admin role, bypasses maintenance mode)
const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app/admin',
  component: () => (
    <RequireAuth>
      <RequireAccountType>
        <RequireAdmin>
          <AppShell>
            <AdminDashboard />
          </AppShell>
        </RequireAdmin>
      </RequireAccountType>
    </RequireAuth>
  ),
});

const routeTree = rootRoute.addChildren([
  signInRoute,
  adminSignInRoute,
  onboardingRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
  subscriptionPaywallRoute,
  adminDashboardRoute,
  protectedLayoutRoute.addChildren([
    browseWorkersRoute,
    workerDetailRoute,
    clientDashboardRoute,
    workerDashboardRoute,
    workerProfileRoute,
    bookingDetailRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <RouterProvider router={router} />
      </InternetIdentityProvider>
    </QueryClientProvider>
  );
}
