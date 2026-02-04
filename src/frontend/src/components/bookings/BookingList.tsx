import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { Calendar, MapPin, Briefcase } from 'lucide-react';
import BookingStatusBadge from './BookingStatusBadge';
import type { Booking } from '../../backend';

interface BookingListProps {
  bookings: Booking[];
  title: string;
  emptyMessage?: string;
}

export default function BookingList({ bookings, title, emptyMessage = 'No bookings found' }: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id.toString()}
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Booking #{booking.id.toString()}</span>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <Calendar className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{booking.dateTime}</span>
              </div>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">{booking.location}</span>
              </div>
              <p className="text-muted-foreground line-clamp-2 pl-6">{booking.jobDetails}</p>
            </div>

            <div className="mt-4">
              <Link to="/app/booking/$bookingId" params={{ bookingId: booking.id.toString() }}>
                <Button size="sm" variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
