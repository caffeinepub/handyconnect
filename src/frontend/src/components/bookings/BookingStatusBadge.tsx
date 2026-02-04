import { Badge } from '@/components/ui/badge';
import { BookingStatus } from '../../backend';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

function getStatusLabel(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.requested: return 'Requested';
    case BookingStatus.accepted: return 'Accepted';
    case BookingStatus.declined: return 'Declined';
    case BookingStatus.cancelled: return 'Cancelled';
    case BookingStatus.completed: return 'Completed';
    default: return 'Unknown';
  }
}

function getStatusVariant(status: BookingStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case BookingStatus.requested: return 'secondary';
    case BookingStatus.accepted: return 'default';
    case BookingStatus.declined: return 'destructive';
    case BookingStatus.cancelled: return 'outline';
    case BookingStatus.completed: return 'outline';
    default: return 'outline';
  }
}

export default function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  return (
    <Badge variant={getStatusVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  );
}
