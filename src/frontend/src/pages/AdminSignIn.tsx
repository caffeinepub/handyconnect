import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, KeyRound } from 'lucide-react';
import { useGetAdminSignInPageSettings, useIsCallerAdmin, useAdminSignInWithCredentials, useIsAdminLoggedIn } from '../hooks/useQueries';

export default function AdminSignIn() {
  const { login, identity, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsCallerAdmin();
  const { data: isAdminLoggedIn, isLoading: isCheckingAdminSession } = useIsAdminLoggedIn();
  const { data: pageSettings, isLoading: isLoadingSettings } = useGetAdminSignInPageSettings();
  const adminSignIn = useAdminSignInWithCredentials();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [credentialError, setCredentialError] = useState('');

  // Check admin status after Internet Identity login or credential login
  useEffect(() => {
    if (!isCheckingAdmin && !isCheckingAdminSession) {
      if (isAdmin || isAdminLoggedIn) {
        navigate({ to: '/app/admin' });
      } else if (identity) {
        // Only show access denied if user logged in via Internet Identity but is not admin
        setShowAccessDenied(true);
      }
    }
  }, [identity, isAdmin, isAdminLoggedIn, isCheckingAdmin, isCheckingAdminSession, navigate]);

  const handleInternetIdentityLogin = async () => {
    try {
      setShowAccessDenied(false);
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialError('');
    setShowAccessDenied(false);

    if (!username.trim() || !password.trim()) {
      setCredentialError('Please enter both username and password');
      return;
    }

    try {
      await adminSignIn.mutateAsync({ username, password });
      // Success - navigation will happen via useEffect
    } catch (error: any) {
      setCredentialError(error.message || 'Invalid username or password');
    }
  };

  const title = pageSettings?.adminSignInTitle || 'Welcome to the Admin Portal';
  const subtitle = pageSettings?.adminSignInSubtitle || 'Please enter your credentials to access the admin console.';
  const helperText = pageSettings?.adminSignInHelperText || 'Contact your super admin if you encounter login issues.';

  const isLoading = isCheckingAdmin || isCheckingAdminSession || adminSignIn.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-primary mb-2">
            {isLoadingSettings ? 'Admin Portal' : title}
          </h1>
          <p className="text-muted-foreground">
            {isLoadingSettings ? 'Secure administrative access' : subtitle}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Sign In</CardTitle>
            <CardDescription>
              Choose your authentication method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {showAccessDenied && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Access denied. You do not have administrator privileges. Please contact your system administrator if you believe this is an error.
                </AlertDescription>
              </Alert>
            )}

            {/* Username/Password Form */}
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {credentialError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{credentialError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {adminSignIn.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Sign In with Credentials
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Internet Identity Button */}
            <Button
              onClick={handleInternetIdentityLogin}
              disabled={loginStatus === 'logging-in' || isLoading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {loginStatus === 'logging-in' || isCheckingAdmin ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  {isCheckingAdmin ? 'Verifying...' : 'Signing in...'}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Internet Identity
                </>
              )}
            </Button>

            {!isLoadingSettings && helperText && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                {helperText}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => navigate({ to: '/' })}
            className="text-sm text-muted-foreground"
          >
            ← Back to User Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
