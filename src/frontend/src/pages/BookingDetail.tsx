import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetBooking, useUpdateBookingStatus, useGetWorkerProfile } from '../hooks/useQueries';
import { useAccountType } from '../hooks/useAccountType';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import BookingStatusBadge from '../components/bookings/BookingStatusBadge';
import AccessDeniedScreen from '../components/auth/AccessDeniedScreen';
import { Calendar, MapPin, Briefcase, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { BookingStatus } from '../backend';

export default function BookingDetail() {
  const { bookingId } = useParams({ from: '/app/booking/$bookingId' });
  const navigate = useNavigate();
  const { data: booking, isLoading, error } = useGetBooking(bookingId);
  const { data: workerProfile } = useGetWorkerProfile(booking?.worker.toString());
  const updateStatus = useUpdateBookingStatus();
  const { isClient } = useAccountType();
  const { identity } = useInternetIdentity();

  const handleStatusUpdate = async (status: BookingStatus) => {
    if (!booking) return;

    try {
      await updateStatus.mutateAsync({
        bookingId: booking.id,
        status: status,
      });
      toast.success(`Booking ${BookingStatus[status]} successfully!`);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(`Failed to update booking. Please try again.`);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return <AccessDeniedScreen />;
  }

  const isBookingClient = identity?.getPrincipal().toString() === booking.client.toString();
  const isBookingWorker = identity?.getPrincipal().toString() === booking.worker.toString();
  const isRequested = booking.status === BookingStatus.requested;
  const isAccepted = booking.status === BookingStatus.accepted;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: isClient ? '/app/client/dashboard' : '/app/worker/dashboard' })}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                Booking #{booking.id.toString()}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {isBookingClient ? 'Your booking request' : 'Booking request for you'}
              </p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Worker Info */}
          {workerProfile && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Worker
              </h3>
              <p className="text-muted-foreground">{workerProfile.displayName}</p>
            </div>
          )}

          <Separator />

          {/* Booking Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Requested Date & Time
              </h3>
              <p className="text-muted-foreground">{booking.dateTime}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </h3>
              <p className="text-muted-foreground">{booking.location}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <Briefcase className="w-4 h-4 mr-2" />
                Job Details
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{booking.jobDetails}</p>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            {isBookingWorker && isRequested && (
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleStatusUpdate(BookingStatus.accepted)}
                  disabled={updateStatus.isPending}
                  className="flex-1"
                >
                  Accept Booking
                </Button>
                <Button
                  onClick={() => handleStatusUpdate(BookingStatus.declined)}
                  disabled={updateStatus.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            )}

            {isBookingWorker && isAccepted && (
              <Button
                onClick={() => handleStatusUpdate(BookingStatus.completed)}
                disabled={updateStatus.isPending}
                className="w-full"
              >
                Mark as Completed
              </Button>
            )}

            {isBookingClient && isRequested && (
              <Button
                onClick={() => handleStatusUpdate(BookingStatus.cancelled)}
                disabled={updateStatus.isPending}
                variant="destructive"
                className="w-full"
              >
                Cancel Booking
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
