import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, KeyRound, Key } from 'lucide-react';
import { 
  useGetAdminSignInPageWithCredentialsCheck, 
  useIsCallerAdmin, 
  useAdminSignInWithCredentials,
  useBootstrapAdminRole
} from '../hooks/useQueries';
import AdminCredentialResetDialog from '../components/admin/AdminCredentialResetDialog';

export default function AdminSignIn() {
  const { login, identity, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: isCheckingAdmin } = useIsCallerAdmin();
  const { data: pageData, isLoading: isLoadingSettings } = useGetAdminSignInPageWithCredentialsCheck();
  const adminSignIn = useAdminSignInWithCredentials();
  const bootstrapAdmin = useBootstrapAdminRole();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [credentialError, setCredentialError] = useState('');
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [bootstrapError, setBootstrapError] = useState('');

  const pageSettings = pageData?.settings;
  const hasCredentials = pageData?.hasCredentials ?? true;

  // Check admin status after Internet Identity login or credential login
  useEffect(() => {
    if (!isCheckingAdmin && isAdmin) {
      navigate({ to: '/app/admin' });
    }
  }, [isAdmin, isCheckingAdmin, navigate]);

  const handleInternetIdentityLogin = async () => {
    try {
      setCredentialError('');
      setBootstrapError('');
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialError('');
    setBootstrapError('');

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

  const handleBootstrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBootstrapError('');

    if (!bootstrapToken.trim()) {
      setBootstrapError('Please enter the admin access token');
      return;
    }

    try {
      const success = await bootstrapAdmin.mutateAsync(bootstrapToken);
      if (success) {
        // Success - navigation will happen via useEffect after admin status refreshes
        setBootstrapToken('');
      } else {
        setBootstrapError('Invalid or expired token. Please check the token and try again.');
      }
    } catch (error: any) {
      setBootstrapError('Failed to bootstrap admin access. Please try again.');
    }
  };

  const title = pageSettings?.adminSignInTitle || 'Welcome to the Admin Portal';
  const subtitle = pageSettings?.adminSignInSubtitle || 'Please enter your credentials to access the admin console.';
  const helperText = pageSettings?.adminSignInHelperText || 'Contact your super admin if you encounter login issues.';

  const isLoading = isCheckingAdmin || adminSignIn.isPending || bootstrapAdmin.isPending;
  const isAuthenticated = !!identity;
  const showBootstrapForm = isAuthenticated && !isAdmin && !isCheckingAdmin;

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
              {showBootstrapForm 
                ? 'Enter your admin access token to gain admin privileges'
                : 'Choose your authentication method'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {showBootstrapForm ? (
              // Bootstrap form for authenticated non-admin users
              <form onSubmit={handleBootstrapSubmit} className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You are logged in but do not have admin privileges. Enter the admin access token to gain access.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="token">Admin Access Token</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Enter admin access token"
                    value={bootstrapToken}
                    onChange={(e) => setBootstrapToken(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {bootstrapError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{bootstrapError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {bootstrapAdmin.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Activating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Activate Admin Access
                    </>
                  )}
                </Button>
              </form>
            ) : (
              // Standard sign-in forms
              <>
                {/* Username/Password Form - only show if credentials are configured */}
                {hasCredentials ? (
                  <>
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

                      {/* Admin Credential Reset Link */}
                      <div className="text-center">
                        <AdminCredentialResetDialog />
                      </div>
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
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Credential-based sign-in is not configured. Please use Internet Identity to sign in.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Internet Identity Button */}
                <Button
                  onClick={handleInternetIdentityLogin}
                  disabled={loginStatus === 'logging-in' || isLoading}
                  variant={hasCredentials ? "outline" : "default"}
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
              </>
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
