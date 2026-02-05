import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { 
  UserProfile, 
  WorkerProfile, 
  PartialWorkerProfile, 
  Booking, 
  NewBooking, 
  BookingStatus,
  ServiceCategory,
  ShoppingItem,
  StripeSessionStatus,
  StripeConfiguration,
  AdminSettings,
  AdminRoleChange,
  PaymentStatus,
  AdminSignInPagePublicSettings
} from '../backend';
import { Principal } from '@dfinity/principal';
import { ExternalBlob } from '../backend';

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// Check if admin is logged in via credentials
export function useIsAdminLoggedIn() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdminLoggedIn'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isAdminLoggedIn();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// Admin credential sign-in mutation
export function useAdminSignInWithCredentials() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      if (!actor) throw new Error('Actor not available');
      const success = await actor.adminSignInWithCredentials(username, password);
      if (!success) {
        throw new Error('Invalid username or password');
      }
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isAdminLoggedIn'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    },
  });
}

// Admin logout mutation
export function useLogOutAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.logOutAdmin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isAdminLoggedIn'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    },
  });
}

export function useIsMaintenanceMode() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['maintenanceMode'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isMaintenanceMode();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAdminSettings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AdminSettings>({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAdminSettings();
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
  });
}

export function useUpdateAdminSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: AdminSettings) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAdminSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      queryClient.invalidateQueries({ queryKey: ['maintenanceMode'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionFee'] });
    },
  });
}

// Admin Sign-In Page Settings (public, no auth required)
export function useGetAdminSignInPageSettings() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AdminSignInPagePublicSettings>({
    queryKey: ['adminSignInPageSettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAdminSignInPageSettings();
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
  });
}

export function useUpdateAdminSignInPageSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: AdminSignInPagePublicSettings) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAdminSignInPageSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSignInPageSettings'] });
    },
  });
}

export function useListAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listAllUsers();
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
  });
}

export function useGetAdminRoleChanges() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AdminRoleChange[]>({
    queryKey: ['adminRoleChanges'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAdminRoleChanges();
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
  });
}

export function useCanRevokeAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['canRevokeAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.canRevokeAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
  });
}

export function useSearchUserByPrincipal() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (principalText: string): Promise<[Principal, UserProfile] | null> => {
      if (!actor) throw new Error('Actor not available');
      return actor.searchUserByPrincipal(principalText);
    },
  });
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
    },
  });
}

// Subscription & Payment Queries
export function useGetSubscriptionFee() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['subscriptionFee'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getSubscriptionFeeInCents();
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
  });
}

export function useGetPaymentStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PaymentStatus | null>({
    queryKey: ['paymentStatus', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getPrincipalPaymentStatus(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}

export function useConfirmPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentSessionId: string): Promise<boolean> => {
      if (!actor) throw new Error('Actor not available');
      return actor.confirmPaymentSuccessful(paymentSessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Stripe Queries
export function useIsStripeConfigured() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
    },
  });
}

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (items: ShoppingItem[]): Promise<CheckoutSession> => {
      if (!actor) throw new Error('Actor not available');
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;
      const result = await actor.createCheckoutSession(items, successUrl, cancelUrl);
      // JSON parsing is important!
      const session = JSON.parse(result) as CheckoutSession;
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    }
  });
}

export function useGetStripeSessionStatus() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (sessionId: string): Promise<StripeSessionStatus> => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStripeSessionStatus(sessionId);
    }
  });
}

// Worker Profile Queries
export function useGetWorkerProfile(workerPrincipal?: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WorkerProfile | null>({
    queryKey: ['workerProfile', workerPrincipal],
    queryFn: async () => {
      if (!actor || !workerPrincipal) return null;
      const principal = Principal.fromText(workerPrincipal);
      return actor.getWorkerProfile(principal);
    },
    enabled: !!actor && !actorFetching && !!workerPrincipal,
  });
}

export function useGetMyWorkerProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<WorkerProfile | null>({
    queryKey: ['myWorkerProfile', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return null;
      return actor.getWorkerProfile(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useCreateWorkerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (profile: PartialWorkerProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createWorkerProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myWorkerProfile', identity?.getPrincipal().toString()] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useUpdateWorkerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (profile: PartialWorkerProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateWorkerProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myWorkerProfile', identity?.getPrincipal().toString()] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

// Profile Image Queries
export function useUploadProfileImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (blob: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadProfileImage(blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myWorkerProfile', identity?.getPrincipal().toString()] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

export function useRemoveProfileImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeProfileImage();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myWorkerProfile', identity?.getPrincipal().toString()] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
}

// Browse Workers Queries
export function useBrowseWorkers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WorkerProfile[]>({
    queryKey: ['workers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.browseWorkers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useBrowseWorkersByCategory(category?: ServiceCategory) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WorkerProfile[]>({
    queryKey: ['workers', 'category', category],
    queryFn: async () => {
      if (!actor || !category) return [];
      return actor.browseWorkersByCategory(category);
    },
    enabled: !!actor && !actorFetching && !!category,
  });
}

export function useBrowseWorkersByRate(direction: 'asc' | 'desc') {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WorkerProfile[]>({
    queryKey: ['workers', 'rate', direction],
    queryFn: async () => {
      if (!actor) return [];
      return direction === 'asc' 
        ? actor.browseWorkersByRateAscending()
        : actor.browseWorkersByRateDescending();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Booking Queries
export function useCreateBooking() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (booking: NewBooking) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBookingRequest(booking);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useGetBooking(bookingId?: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Booking | null>({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      if (!actor || !bookingId) return null;
      try {
        return await actor.getBooking(BigInt(bookingId));
      } catch (error) {
        console.error('Error fetching booking:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!bookingId,
    retry: false,
  });
}

export function useGetMyBookings() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<Booking[]>({
    queryKey: ['bookings', 'my', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      const principal = identity.getPrincipal();
      
      // Try to get bookings as both client and worker
      const [clientBookings, workerBookings] = await Promise.all([
        actor.getBookingsByClient(principal).catch(() => []),
        actor.getBookingsByWorker(principal).catch(() => []),
      ]);
      
      // Combine and deduplicate
      const allBookings = [...clientBookings, ...workerBookings];
      const uniqueBookings = Array.from(
        new Map(allBookings.map(b => [b.id.toString(), b])).values()
      );
      
      return uniqueBookings;
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useUpdateBookingStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: bigint; status: BookingStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBookingStatus(bookingId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}
