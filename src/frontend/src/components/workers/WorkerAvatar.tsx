import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { WorkerProfile } from '../../backend';
import { User } from 'lucide-react';

interface WorkerAvatarProps {
  worker: WorkerProfile;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export default function WorkerAvatar({ worker, size = 'md' }: WorkerAvatarProps) {
  const imageUrl = worker.profileImage?.getDirectURL();
  
  // Get initials from display name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Avatar className={sizeClasses[size]}>
      {imageUrl && (
        <AvatarImage 
          src={imageUrl} 
          alt={`${worker.displayName}'s profile`}
        />
      )}
      <AvatarFallback className="bg-primary/10 text-primary">
        {worker.displayName ? getInitials(worker.displayName) : <User className={iconSizes[size]} />}
      </AvatarFallback>
    </Avatar>
  );
}
