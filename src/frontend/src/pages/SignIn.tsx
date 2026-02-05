import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Wrench, ShieldCheck } from 'lucide-react';

export default function SignIn() {
  const { login, identity, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      navigate({ to: '/app/browse' });
    }
  }, [identity, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-accent/20 to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/assets/generated/handyconnect-logo.dim_512x512.png" 
              alt="HandyConnect" 
              className="h-20 w-20"
            />
          </div>
          <h1 className="font-display text-4xl font-bold text-primary mb-2">HandyConnect</h1>
          <p className="text-muted-foreground">
            Connect with skilled local workers for your home services
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to browse workers and manage bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogin}
              disabled={loginStatus === 'logging-in'}
              className="w-full"
              size="lg"
            >
              {loginStatus === 'logging-in' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">New to HandyConnect? Sign in to get started.</p>
          <Button
            variant="link"
            onClick={() => navigate({ to: '/admin-signin' })}
            className="text-sm flex items-center gap-2 mx-auto"
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
