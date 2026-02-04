import { useGetMyBookings, useGetMyWorkerProfile } from '../hooks/useQueries';
import BookingList from '../components/bookings/BookingList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { BookingStatus } from '../backend';

export default function WorkerDashboard() {
  const { data: bookings = [], isLoading: bookingsLoading } = useGetMyBookings();
  const { data: profile, isLoading: profileLoading } = useGetMyWorkerProfile();

  const requestedBookings = bookings.filter(b => b.status === BookingStatus.requested);
  const acceptedBookings = bookings.filter(b => b.status === BookingStatus.accepted);
  const completedBookings = bookings.filter(b => b.status === BookingStatus.completed);
  const otherBookings = bookings.filter(b => 
    b.status === BookingStatus.declined || b.status === BookingStatus.cancelled
  );

  const isProfileComplete = profile && 
    profile.displayName && 
    profile.description && 
    profile.serviceArea && 
    profile.hourlyRate > 0;

  if (bookingsLoading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Worker Dashboard</h1>
        <p className="text-muted-foreground">Manage your bookings and profile</p>
      </div>

      {/* Profile Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Profile Status</CardTitle>
          <CardDescription>
            {isProfileComplete 
              ? 'Your profile is complete and visible to clients'
              : 'Complete your profile to start receiving bookings'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isProfileComplete ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Profile Complete</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium">Profile Incomplete</span>
                </>
              )}
            </div>
            <Link to="/app/worker/profile">
              <Button variant={isProfileComplete ? 'outline' : 'default'}>
                {isProfileComplete ? 'Edit Profile' : 'Complete Profile'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Bookings */}
      <div className="space-y-6">
        <BookingList
          bookings={requestedBookings}
          title="New Requests"
          emptyMessage="No new booking requests"
        />

        <BookingList
          bookings={acceptedBookings}
          title="Accepted Bookings"
          emptyMessage="No accepted bookings"
        />

        <BookingList
          bookings={completedBookings}
          title="Completed"
          emptyMessage="No completed bookings yet"
        />

        {otherBookings.length > 0 && (
          <BookingList
            bookings={otherBookings}
            title="Declined & Cancelled"
            emptyMessage=""
          />
        )}
      </div>
    </div>
  );
}
