import { useGetMyBookings } from '../hooks/useQueries';
import BookingList from '../components/bookings/BookingList';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { BookingStatus } from '../backend';

export default function ClientDashboard() {
  const { data: bookings = [], isLoading } = useGetMyBookings();

  const upcomingBookings = bookings.filter(b => 
    b.status === BookingStatus.requested || b.status === BookingStatus.accepted
  );

  const pastBookings = bookings.filter(b => 
    b.status === BookingStatus.completed || b.status === BookingStatus.declined || b.status === BookingStatus.cancelled
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">Manage your service requests</p>
        </div>
        <Link to="/app/browse">
          <Button>
            <Search className="w-4 h-4 mr-2" />
            Browse Workers
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <BookingList
          bookings={upcomingBookings}
          title="Upcoming & Active"
          emptyMessage="No upcoming bookings. Browse workers to get started!"
        />

        <BookingList
          bookings={pastBookings}
          title="Past Bookings"
          emptyMessage="No past bookings yet"
        />
      </div>
    </div>
  );
}
