import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

// Pages
import SignIn from './pages/SignIn';
import OnboardingAccountType from './pages/OnboardingAccountType';
import BrowseWorkers from './pages/BrowseWorkers';
import WorkerDetail from './pages/WorkerDetail';
import WorkerProfile from './pages/WorkerProfile';
import ClientDashboard from './pages/ClientDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import BookingDetail from './pages/BookingDetail';

// Guards
import RequireAuth from './components/auth/RequireAuth';
import RequireAccountType from './components/auth/RequireAccountType';
import RequireRole from './components/auth/RequireRole';

// Layout
import AppShell from './components/layout/AppShell';

import { AccountType } from './backend';

const queryClient = new QueryClient();

// Root route with layout
const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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

// Protected routes with layout
const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: () => (
    <RequireAuth>
      <RequireAccountType>
        <AppShell>
          <Outlet />
        </AppShell>
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

const routeTree = rootRoute.addChildren([
  signInRoute,
  onboardingRoute,
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
