import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
import { useResetAdminCredentialsByPhoneNumber } from '../../hooks/useQueries';

interface AdminCredentialResetDialogProps {
  trigger?: React.ReactNode;
}

export default function AdminCredentialResetDialog({ trigger }: AdminCredentialResetDialogProps) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const resetMutation = useResetAdminCredentialsByPhoneNumber();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setResetSuccess(false);

    // Client-side validation
    if (!phoneNumber.trim()) {
      setValidationError('Recovery phone number is required');
      return;
    }
    if (!newUsername.trim()) {
      setValidationError('New username is required');
      return;
    }
    if (!newPassword.trim()) {
      setValidationError('New password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    try {
      const success = await resetMutation.mutateAsync({
        phoneNumber: phoneNumber.trim(),
        newUsername: newUsername.trim(),
        newPassword: newPassword.trim(),
      });

      if (success) {
        setResetSuccess(true);
        // Clear form fields
        setPhoneNumber('');
        setNewUsername('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setValidationError('Unable to reset credentials. Please verify your recovery phone number and try again.');
      }
    } catch (error: any) {
      setValidationError('An error occurred. Please try again later.');
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setPhoneNumber('');
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
      setValidationError('');
      setResetSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      } else {
        setOpen(true);
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="link" className="text-sm text-muted-foreground">
            Forgot your credentials?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset Admin Credentials
          </DialogTitle>
          <DialogDescription>
            Enter your recovery phone number and new credentials to reset your admin access.
          </DialogDescription>
        </DialogHeader>

        {resetSuccess ? (
          <div className="space-y-4 py-4">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Your admin credentials have been successfully reset!
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              You can now close this dialog and sign in with your new username and password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-phone">Recovery Phone Number</Label>
              <Input
                id="recovery-phone"
                type="tel"
                placeholder="Enter recovery phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={resetMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-username">New Username</Label>
              <Input
                id="new-username"
                type="text"
                placeholder="Enter new username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={resetMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={resetMutation.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={resetMutation.isPending}
                required
              />
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={resetMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetMutation.isPending}>
                {resetMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Resetting...
                  </>
                ) : (
                  'Reset Credentials'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {resetSuccess && (
          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Close and Sign In
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
