import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useGetStripeSessionStatus, useConfirmPayment, useGetCallerUserProfile } from '../hooks/useQueries';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const verifySession = useGetStripeSessionStatus();
  const confirmPayment = useConfirmPayment();
  const { data: userProfile } = useGetCallerUserProfile();

  useEffect(() => {
    // Get session ID from URL
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    
    if (!sid) {
      toast.error('Payment session not found');
      navigate({ to: '/onboarding' });
      return;
    }

    setSessionId(sid);

    // Verify the session
    verifySession.mutateAsync(sid).then((status) => {
      if (status.__kind__ === 'completed') {
        setIsVerified(true);
      } else {
        toast.error('Payment verification failed');
        navigate({ to: '/payment-failure' });
      }
    }).catch((error) => {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
      navigate({ to: '/payment-failure' });
    });
  }, []);

  const handleContinue = async () => {
    if (!sessionId) {
      toast.error('Session ID missing');
      return;
    }

    setIsConfirming(true);

    try {
      const confirmed = await confirmPayment.mutateAsync(sessionId);
      
      if (confirmed) {
        toast.success('Payment confirmed successfully!');
        
        // Check if user has completed onboarding
        const storedRole = sessionStorage.getItem('onboarding_role');
        
        if (storedRole && !userProfile) {
          // User is in onboarding flow, redirect back to complete profile
          navigate({ to: '/onboarding' });
        } else {
          // User already has profile, redirect to appropriate dashboard
          const accountType = userProfile?.accountType;
          if (accountType === 'client') {
            navigate({ to: '/app/client/dashboard' });
          } else if (accountType === 'worker') {
            navigate({ to: '/app/worker/dashboard' });
          } else {
            navigate({ to: '/app/browse' });
          }
        }
      } else {
        toast.error('Payment confirmation failed. Please contact support.');
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error(error.message || 'Failed to confirm payment');
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>
            Your subscription has been confirmed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Thank you for subscribing to HandyConnect. Click below to continue.
          </p>
          <Button 
            onClick={handleContinue} 
            disabled={isConfirming}
            className="w-full"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
