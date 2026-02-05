import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetWorkerProfile, useCreateBooking } from '../hooks/useQueries';
import { useAccountType } from '../hooks/useAccountType';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, ArrowLeft, Phone } from 'lucide-react';
import CreateBookingForm from '../components/bookings/CreateBookingForm';
import WorkerAvatar from '../components/workers/WorkerAvatar';
import { useState } from 'react';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import type { WorkerProfile } from '../backend';

function getCategoryLabel(category: WorkerProfile['category']): string {
  if (category.__kind__ === 'plumbing') return 'Plumbing';
  if (category.__kind__ === 'electrical') return 'Electrical';
  if (category.__kind__ === 'cleaning') return 'Cleaning';
  if (category.__kind__ === 'gardening') return 'Gardening';
  if (category.__kind__ === 'other') return category.other;
  return 'Other';
}

export default function WorkerDetail() {
  const { workerId } = useParams({ from: '/app/worker/$workerId' });
  const navigate = useNavigate();
  const { data: worker, isLoading } = useGetWorkerProfile(workerId);
  const { isClient } = useAccountType();
  const createBooking = useCreateBooking();
  const [showBookingForm, setShowBookingForm] = useState(false);

  const handleBookingSubmit = async (data: { dateTime: string; jobDetails: string; location: string }) => {
    try {
      await createBooking.mutateAsync({
        worker: Principal.fromText(workerId),
        dateTime: data.dateTime,
        jobDetails: data.jobDetails,
        location: data.location,
      });
      toast.success('Booking request submitted successfully!');
      setShowBookingForm(false);
      navigate({ to: '/app/client/dashboard' });
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading worker profile...</p>
        </div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Worker not found</h3>
            <p className="text-muted-foreground mb-4">
              This worker profile doesn't exist or has been removed
            </p>
            <Button onClick={() => navigate({ to: '/app/browse' })}>
              Back to Browse
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryLabel = getCategoryLabel(worker.category);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate({ to: '/app/browse' })}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Browse
      </Button>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <WorkerAvatar worker={worker} size="xl" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">{worker.displayName}</CardTitle>
                      <Badge variant="secondary" className="text-base">
                        {categoryLabel}
                      </Badge>
                    </div>
                    {!worker.isActive && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{worker.description}</p>
              </div>

              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
                <span>{worker.serviceArea}</span>
              </div>

              {worker.phoneNumber && (
                <div className="flex items-center text-muted-foreground">
                  <Phone className="w-5 h-5 mr-2 flex-shrink-0" />
                  <a href={`tel:${worker.phoneNumber}`} className="hover:text-primary transition-colors">
                    {worker.phoneNumber}
                  </a>
                </div>
              )}

              <div className="flex items-center text-2xl font-bold text-primary pt-4 border-t">
                <DollarSign className="w-6 h-6" />
                <span>{Number(worker.hourlyRate)}</span>
                <span className="text-base font-normal text-muted-foreground ml-1">/hour</span>
              </div>
            </CardContent>
          </Card>

          {isClient && worker.isActive && showBookingForm && (
            <CreateBookingForm
              onSubmit={handleBookingSubmit}
              isLoading={createBooking.isPending}
            />
          )}
        </div>

        <div className="space-y-4">
          {isClient && worker.isActive && !showBookingForm && (
            <Button
              onClick={() => setShowBookingForm(true)}
              className="w-full"
              size="lg"
            >
              Request Booking
            </Button>
          )}
          {isClient && worker.isActive && showBookingForm && (
            <Button
              onClick={() => setShowBookingForm(false)}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
