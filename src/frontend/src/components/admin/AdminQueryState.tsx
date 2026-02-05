import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface AdminQueryStateProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  loadingMessage?: string;
  errorMessage?: string;
}

export default function AdminQueryState({
  isLoading,
  isError,
  error,
  onRetry,
  loadingMessage = 'Loading...',
  errorMessage,
}: AdminQueryStateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  if (isError) {
    const displayMessage = errorMessage || error?.message || 'An error occurred while loading data';
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{displayMessage}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4"
            >
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
