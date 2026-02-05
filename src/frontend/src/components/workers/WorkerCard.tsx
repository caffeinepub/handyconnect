import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { WorkerProfile } from '../../backend';
import WorkerAvatar from './WorkerAvatar';

interface WorkerCardProps {
  worker: WorkerProfile;
}

function getCategoryLabel(category: WorkerProfile['category']): string {
  if (category.__kind__ === 'plumbing') return 'Plumbing';
  if (category.__kind__ === 'electrical') return 'Electrical';
  if (category.__kind__ === 'cleaning') return 'Cleaning';
  if (category.__kind__ === 'gardening') return 'Gardening';
  if (category.__kind__ === 'other') return category.other;
  return 'Other';
}

export default function WorkerCard({ worker }: WorkerCardProps) {
  const categoryLabel = getCategoryLabel(worker.category);

  return (
    <Card className="hover:shadow-soft transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          <WorkerAvatar worker={worker} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg truncate">{worker.displayName}</CardTitle>
              {!worker.isActive && (
                <Badge variant="outline" className="text-muted-foreground shrink-0">
                  Inactive
                </Badge>
              )}
            </div>
            <Badge variant="secondary" className="mt-2">
              {categoryLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {worker.description}
        </p>
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="line-clamp-1">{worker.serviceArea}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center text-primary font-semibold">
            <DollarSign className="w-4 h-4" />
            <span>{Number(worker.hourlyRate)}/hr</span>
          </div>
          <Link to="/app/worker/$workerId" params={{ workerId: worker.owner.toString() }}>
            <Button size="sm">View Profile</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
