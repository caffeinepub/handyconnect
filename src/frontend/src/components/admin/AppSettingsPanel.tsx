import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Settings, AlertTriangle, DollarSign, ShieldCheck } from 'lucide-react';
import { useGetAdminSettings, useUpdateAdminSettings, useGetAdminSignInPageSettings, useUpdateAdminSignInPageSettings } from '../../hooks/useQueries';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AdminQueryState from './AdminQueryState';

export default function AppSettingsPanel() {
  const { data: settings, isLoading, isError, error, refetch } = useGetAdminSettings();
  const { data: adminSignInSettings, isLoading: isLoadingSignInSettings } = useGetAdminSignInPageSettings();
  const updateSettings = useUpdateAdminSettings();
  const updateSignInSettings = useUpdateAdminSignInPageSettings();
  
  const [appName, setAppName] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [subscriptionFee, setSubscriptionFee] = useState('');
  const [subscriptionFeeError, setSubscriptionFeeError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Admin Sign-In Page Customization
  const [adminSignInTitle, setAdminSignInTitle] = useState('');
  const [adminSignInSubtitle, setAdminSignInSubtitle] = useState('');
  const [adminSignInHelperText, setAdminSignInHelperText] = useState('');
  const [isSignInDirty, setIsSignInDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setAppName(settings.appName);
      setMaintenanceMode(settings.maintenanceMode);
      setSubscriptionFee((Number(settings.subscriptionFeeInCents) / 100).toFixed(2));
      setIsDirty(false);
      setSubscriptionFeeError('');
    }
  }, [settings]);

  useEffect(() => {
    if (adminSignInSettings) {
      setAdminSignInTitle(adminSignInSettings.adminSignInTitle);
      setAdminSignInSubtitle(adminSignInSettings.adminSignInSubtitle);
      setAdminSignInHelperText(adminSignInSettings.adminSignInHelperText);
      setIsSignInDirty(false);
    }
  }, [adminSignInSettings]);

  useEffect(() => {
    if (settings) {
      const feeInCents = Math.round(parseFloat(subscriptionFee || '0') * 100);
      const hasChanges = 
        appName !== settings.appName || 
        maintenanceMode !== settings.maintenanceMode ||
        feeInCents !== Number(settings.subscriptionFeeInCents);
      setIsDirty(hasChanges);
    }
  }, [appName, maintenanceMode, subscriptionFee, settings]);

  useEffect(() => {
    if (adminSignInSettings) {
      const hasChanges = 
        adminSignInTitle !== adminSignInSettings.adminSignInTitle ||
        adminSignInSubtitle !== adminSignInSettings.adminSignInSubtitle ||
        adminSignInHelperText !== adminSignInSettings.adminSignInHelperText;
      setIsSignInDirty(hasChanges);
    }
  }, [adminSignInTitle, adminSignInSubtitle, adminSignInHelperText, adminSignInSettings]);

  const validateSubscriptionFee = (value: string): boolean => {
    if (!value.trim()) {
      setSubscriptionFeeError('Subscription fee is required');
      return false;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setSubscriptionFeeError('Please enter a valid number');
      return false;
    }

    if (numValue < 0) {
      setSubscriptionFeeError('Subscription fee cannot be negative');
      return false;
    }

    setSubscriptionFeeError('');
    return true;
  };

  const handleSubscriptionFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSubscriptionFee(value);
    if (value.trim()) {
      validateSubscriptionFee(value);
    } else {
      setSubscriptionFeeError('');
    }
  };

  const handleSave = async () => {
    if (!settings || !isDirty) return;

    if (!validateSubscriptionFee(subscriptionFee)) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    try {
      const feeInCents = Math.round(parseFloat(subscriptionFee) * 100);
      await updateSettings.mutateAsync({
        appName,
        maintenanceMode,
        subscriptionFeeInCents: BigInt(feeInCents),
      });
      toast.success('Settings updated successfully');
      setIsDirty(false);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update settings';
      toast.error(errorMessage);
    }
  };

  const handleSaveSignInSettings = async () => {
    if (!adminSignInSettings || !isSignInDirty) return;

    try {
      await updateSignInSettings.mutateAsync({
        adminSignInTitle,
        adminSignInSubtitle,
        adminSignInHelperText,
      });
      toast.success('Admin sign-in page settings updated successfully');
      setIsSignInDirty(false);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update admin sign-in page settings';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Configure application-wide settings, subscription pricing, and maintenance mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AdminQueryState
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            loadingMessage="Loading settings..."
            errorMessage="Failed to load settings. Please check your permissions and try again."
          />

          {!isLoading && !isError && settings && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input
                    id="app-name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Enter application name"
                  />
                  <p className="text-xs text-muted-foreground">
                    The name displayed throughout the application
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscription-fee" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Subscription Fee (USD)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="subscription-fee"
                      type="text"
                      value={subscriptionFee}
                      onChange={handleSubscriptionFeeChange}
                      placeholder="9.99"
                      className={`pl-7 ${subscriptionFeeError ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {subscriptionFeeError && (
                    <p className="text-xs text-destructive">{subscriptionFeeError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    One-time subscription fee charged to new users during onboarding
                  </p>
                </div>

                <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="maintenance-mode" className="text-base font-medium">
                      Maintenance Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, non-admin users cannot access the application
                    </p>
                  </div>
                  <Switch
                    id="maintenance-mode"
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                  />
                </div>

                {maintenanceMode && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Warning: Enabling maintenance mode will prevent all non-admin users from accessing the application.
                    </AlertDescription>
                  </Alert>
                )}

                {isDirty && (
                  <Alert>
                    <AlertDescription>
                      You have unsaved changes. Click "Save Settings" to apply them.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button 
                onClick={handleSave} 
                disabled={updateSettings.isPending || !isDirty || !!subscriptionFeeError}
                className="w-full"
              >
                {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Admin Sign-In Page Customization
          </CardTitle>
          <CardDescription>
            Customize the text displayed on the admin sign-in page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingSignInSettings ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-signin-title">Page Title</Label>
                  <Input
                    id="admin-signin-title"
                    value={adminSignInTitle}
                    onChange={(e) => setAdminSignInTitle(e.target.value)}
                    placeholder="Welcome to the Admin Portal"
                  />
                  <p className="text-xs text-muted-foreground">
                    Main heading displayed on the admin sign-in page
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-signin-subtitle">Page Subtitle</Label>
                  <Textarea
                    id="admin-signin-subtitle"
                    value={adminSignInSubtitle}
                    onChange={(e) => setAdminSignInSubtitle(e.target.value)}
                    placeholder="Please enter your credentials to access the admin console."
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Description text shown below the title
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-signin-helper">Helper Text</Label>
                  <Textarea
                    id="admin-signin-helper"
                    value={adminSignInHelperText}
                    onChange={(e) => setAdminSignInHelperText(e.target.value)}
                    placeholder="Contact your super admin if you encounter login issues."
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Additional help text displayed at the bottom of the sign-in card
                  </p>
                </div>

                {isSignInDirty && (
                  <Alert>
                    <AlertDescription>
                      You have unsaved changes. Click "Save Admin Sign-In Settings" to apply them.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button 
                onClick={handleSaveSignInSettings} 
                disabled={updateSignInSettings.isPending || !isSignInDirty}
                className="w-full"
              >
                {updateSignInSettings.isPending ? 'Saving...' : 'Save Admin Sign-In Settings'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
