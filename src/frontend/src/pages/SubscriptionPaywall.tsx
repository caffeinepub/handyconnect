import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { useCreateCheckoutSession, useGetSubscriptionFee, useIsStripeConfigured } from '../hooks/useQueries';
import { toast } from 'sonner';
import { createSubscriptionItem, DEFAULT_SUBSCRIPTION_FEE_CENTS } from '../config/subscription';

export default function SubscriptionPaywall() {
  const createCheckout = useCreateCheckoutSession();
  const { data: subscriptionFeeCents, isLoading: loadingFee } = useGetSubscriptionFee();
  const { data: isStripeConfigured, isLoading: checkingStripe } = useIsStripeConfigured();

  // Compute the subscription fee to use (backend value or fallback)
  const feeInCents = subscriptionFeeCents ? Number(subscriptionFeeCents) : DEFAULT_SUBSCRIPTION_FEE_CENTS;
  const feeInDollars = (feeInCents / 100).toFixed(2);

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle>Subscription Payment Required</CardTitle>
          <CardDescription>
            Your 2-day grace period has expired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Access to HandyConnect is blocked until you complete your subscription payment. 
              This is required to continue using the platform.
            </AlertDescription>
          </Alert>

          <div className="p-6 bg-muted rounded-lg text-center">
            <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-2xl font-bold mb-2">
              ${feeInDollars}
            </p>
            <p className="text-sm text-muted-foreground">
              One-time subscription fee
            </p>
          </div>

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

            <p className="text-xs text-center text-muted-foreground">
              You'll be redirected to our secure payment processor
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
