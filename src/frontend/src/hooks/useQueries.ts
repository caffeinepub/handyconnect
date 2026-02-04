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
  ServiceCategory 
} from '../backend';
import { Principal } from '@dfinity/principal';

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
    },
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
