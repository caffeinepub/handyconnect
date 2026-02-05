import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentFailure() {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Clear any stored session data
    sessionStorage.removeItem('onboarding_payment_session');
    navigate({ to: '/onboarding' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle>Payment Not Completed</CardTitle>
          <CardDescription>
            Your payment was cancelled or failed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Don't worry! You can try again whenever you're ready. Your progress has been saved.
          </p>
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
