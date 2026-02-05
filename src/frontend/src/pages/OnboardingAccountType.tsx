import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useSaveCallerUserProfile, 
  useCreateCheckoutSession, 
  useIsStripeConfigured,
  useGetSubscriptionFee 
} from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Briefcase, User, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { AccountType } from '../backend';
import { createSubscriptionItem, DEFAULT_SUBSCRIPTION_FEE_CENTS } from '../config/subscription';

export default function OnboardingAccountType() {
  const [step, setStep] = useState<'role' | 'name' | 'payment'>('role');
  const [selectedRole, setSelectedRole] = useState<AccountType | null>(null);
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();
  const createCheckout = useCreateCheckoutSession();
  const { data: isStripeConfigured, isLoading: checkingStripe } = useIsStripeConfigured();
  const { data: subscriptionFeeCents, isLoading: loadingFee } = useGetSubscriptionFee();
  const navigate = useNavigate();

  // Compute the subscription fee to use (backend value or fallback)
  const feeInCents = subscriptionFeeCents ? Number(subscriptionFeeCents) : DEFAULT_SUBSCRIPTION_FEE_CENTS;
  const feeInDollars = (feeInCents / 100).toFixed(2);

  // Check for returning from payment
  useEffect(() => {
    const storedRole = sessionStorage.getItem('onboarding_role');
    const storedName = sessionStorage.getItem('onboarding_name');
    
    if (storedRole && storedName) {
      setSelectedRole(storedRole as AccountType);
      setName(storedName);
    }
  }, []);

  const handleRoleSelect = (role: AccountType) => {
    setSelectedRole(role);
    setStep('name');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !name.trim()) return;
    
    // Store data for potential payment flow
    sessionStorage.setItem('onboarding_role', selectedRole);
    sessionStorage.setItem('onboarding_name', name.trim());
    
    setStep('payment');
  };

  const handleSkipPayment = async () => {
    if (!selectedRole || !name.trim()) {
      toast.error('Missing required information. Please start over.');
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        accountType: selectedRole,
      });

      // Clear session storage
      sessionStorage.removeItem('onboarding_role');
      sessionStorage.removeItem('onboarding_name');

      toast.success('Profile created successfully! Remember to complete payment within 2 days.');
      
      // Navigate to appropriate dashboard
      const path = selectedRole === AccountType.client ? '/app/client/dashboard' : '/app/worker/dashboard';
      navigate({ to: path });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to create profile. Please try again.');
    }
  };

  const handlePayment = async () => {
    if (!isStripeConfigured) {
      toast.error('Payment system is not configured. Please contact support.');
      return;
    }

    try {
      const subscriptionItem = createSubscriptionItem(feeInCents);
      const session = await createCheckout.mutateAsync([subscriptionItem]);
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      
      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to initiate payment. Please try again.');
    }
  };

  if (checkingStripe || loadingFee) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Subscription</CardTitle>
            <CardDescription>
              Join HandyConnect with a one-time subscription fee
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-muted rounded-lg text-center">
              <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-2xl font-bold mb-2">
                ${feeInDollars}
              </p>
              <p className="text-sm text-muted-foreground">
                One-time subscription fee
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You can skip payment now, but you must complete it within 2 days to continue using HandyConnect.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={handlePayment}
                disabled={createCheckout.isPending || !isStripeConfigured}
                className="w-full"
              >
                {createCheckout.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleSkipPayment}
                disabled={saveProfile.isPending || createCheckout.isPending}
                className="w-full"
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  'Skip for now'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('name')}
                disabled={saveProfile.isPending || createCheckout.isPending}
                className="w-full"
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <form onSubmit={handleNameSubmit} className="space-y-4">
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
                  disabled={!name.trim()}
                  className="flex-1"
                >
                  Continue
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
