import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Shield, ShieldOff } from 'lucide-react';

interface AdminRoleConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'grant' | 'revoke';
  userName: string;
  onConfirm: () => void;
  isBlocked?: boolean;
  blockReason?: string;
}

export default function AdminRoleConfirmDialog({
  open,
  onOpenChange,
  action,
  userName,
  onConfirm,
  isBlocked = false,
  blockReason,
}: AdminRoleConfirmDialogProps) {
  const isGrant = action === 'grant';

  const handleConfirm = () => {
    if (!isBlocked) {
      onConfirm();
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isGrant ? (
              <Shield className="w-5 h-5 text-primary" />
            ) : (
              <ShieldOff className="w-5 h-5 text-destructive" />
            )}
            {isGrant ? 'Grant Admin Role' : 'Revoke Admin Role'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              {isGrant
                ? `Are you sure you want to grant admin privileges to ${userName}?`
                : `Are you sure you want to revoke admin privileges from ${userName}?`}
            </p>
            {isGrant && (
              <p className="text-sm">
                This user will have full access to all admin features including user management and application settings.
              </p>
            )}
            {!isGrant && !isBlocked && (
              <p className="text-sm">
                This user will lose access to all admin features and will be returned to regular user status.
              </p>
            )}
            {isBlocked && blockReason && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">{blockReason}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isBlocked}
            className={isGrant ? '' : 'bg-destructive hover:bg-destructive/90'}
          >
            {isGrant ? 'Grant Admin' : 'Revoke Admin'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
