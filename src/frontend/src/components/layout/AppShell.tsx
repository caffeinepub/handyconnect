import { ReactNode } from 'react';
import TopNav from '../nav/TopNav';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useGetPaymentStatus } from '../../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { data: paymentStatus } = useGetPaymentStatus();
  const navigate = useNavigate();

  const showPaymentBanner = paymentStatus?.__kind__ === 'pending';

  const handleGoToPayment = () => {
    navigate({ to: '/subscription-paywall' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      {showPaymentBanner && (
        <div className="bg-warning/10 border-b border-warning">
          <div className="container mx-auto px-4 py-3">
            <Alert className="border-warning bg-transparent">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertDescription className="flex items-center justify-between gap-4">
                <span className="text-sm">
                  <strong>Payment Required:</strong> Complete your subscription within 2 days to keep using HandyConnect.
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleGoToPayment}
                  className="shrink-0"
                >
                  Complete Payment
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2026. Built with ❤️ using{' '}
          <a 
            href="https://caffeine.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
