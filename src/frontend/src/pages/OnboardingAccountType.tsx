import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Briefcase, User } from 'lucide-react';
import { AccountType } from '../backend';

export default function OnboardingAccountType() {
  const [step, setStep] = useState<'role' | 'name'>('role');
  const [selectedRole, setSelectedRole] = useState<AccountType | null>(null);
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();
  const navigate = useNavigate();

  const handleRoleSelect = (role: AccountType) => {
    setSelectedRole(role);
    setStep('name');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !name.trim()) return;

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        accountType: selectedRole,
      });

      toast.success('Profile created successfully!');
      
      // Navigate to appropriate dashboard
      const path = selectedRole === AccountType.client ? '/app/client/dashboard' : '/app/worker/dashboard';
      navigate({ to: path });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to create profile. Please try again.');
    }
  };

  if (step === 'name') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>What's your name?</CardTitle>
            <CardDescription>
              This will be displayed on your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  autoFocus
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('role')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={!name.trim() || saveProfile.isPending}
                  className="flex-1"
                >
                  {saveProfile.isPending ? 'Creating...' : 'Continue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to HandyConnect</h1>
          <p className="text-muted-foreground">
            Choose how you'd like to use the platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-soft transition-all hover:border-primary"
            onClick={() => handleRoleSelect(AccountType.client)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>I'm a Client</CardTitle>
              <CardDescription>
                Looking for skilled workers to help with home services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Browse and search workers</li>
                <li>• Request bookings</li>
                <li>• Manage appointments</li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-soft transition-all hover:border-primary"
            onClick={() => handleRoleSelect(AccountType.worker)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-secondary" />
              </div>
              <CardTitle>I'm a Worker</CardTitle>
              <CardDescription>
                Offering professional services to homeowners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Create your profile</li>
                <li>• Receive booking requests</li>
                <li>• Manage your schedule</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
