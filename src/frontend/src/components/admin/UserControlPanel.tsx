import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, User, Copy, CheckCircle2 } from 'lucide-react';
import { 
  useListAllUsers, 
  useSearchUserByPrincipal
} from '../../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import AdminQueryState from './AdminQueryState';

export default function UserControlPanel() {
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState<[Principal, any] | null>(null);
  const [validationError, setValidationError] = useState('');
  const [copiedPrincipal, setCopiedPrincipal] = useState<string | null>(null);
  
  const { data: allUsers, isLoading: usersLoading, isError: usersError, error: usersErrorObj, refetch: refetchUsers } = useListAllUsers();
  const searchUser = useSearchUserByPrincipal();

  const validatePrincipal = (text: string): boolean => {
    if (!text.trim()) {
      setValidationError('Please enter a Principal ID');
      return false;
    }

    try {
      Principal.fromText(text.trim());
      setValidationError('');
      return true;
    } catch {
      setValidationError('Invalid Principal ID format');
      return false;
    }
  };

  const handleSearch = async () => {
    if (!validatePrincipal(searchText)) {
      return;
    }

    try {
      const result = await searchUser.mutateAsync(searchText.trim());
      setSearchResult(result);
      if (!result) {
        // Don't show toast, we'll show empty state instead
      }
    } catch (error: any) {
      toast.error('Failed to search user');
      setSearchResult(null);
    }
  };

  const handleCopyPrincipal = async (principal: string) => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopiedPrincipal(principal);
      toast.success('Principal ID copied to clipboard');
      setTimeout(() => setCopiedPrincipal(null), 2000);
    } catch {
      toast.error('Failed to copy Principal ID');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search User by Principal</CardTitle>
          <CardDescription>
            Enter a Principal ID to view user profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="principal-search" className="sr-only">Principal ID</Label>
              <Input
                id="principal-search"
                placeholder="Enter Principal ID (e.g., xxxxx-xxxxx-xxxxx-xxxxx-xxx)"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  if (validationError) {
                    setValidationError('');
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className={validationError ? 'border-destructive' : ''}
              />
              {validationError && (
                <p className="text-sm text-destructive mt-1">{validationError}</p>
              )}
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={searchUser.isPending || !!validationError}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {searchUser.isSuccess && searchResult && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Principal ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-mono break-all flex-1">{searchResult[0].toString()}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyPrincipal(searchResult[0].toString())}
                      className="flex-shrink-0"
                    >
                      {copiedPrincipal === searchResult[0].toString() ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="text-sm">{searchResult[1].name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Account Type</Label>
                  <p className="text-sm capitalize">
                    {searchResult[1].accountType ? String(searchResult[1].accountType) : 'Not set'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {searchUser.isSuccess && !searchResult && (
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                <User className="w-4 h-4" />
                No user found with this Principal ID. The user may not have completed registration.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            List of all registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminQueryState
            isLoading={usersLoading}
            isError={usersError}
            error={usersErrorObj}
            onRetry={refetchUsers}
            loadingMessage="Loading users..."
            errorMessage="Failed to load users. Please check your permissions and try again."
          />

          {!usersLoading && !usersError && (!allUsers || allUsers.length === 0) && (
            <Alert>
              <AlertDescription>
                No users found in the system.
              </AlertDescription>
            </Alert>
          )}

          {!usersLoading && !usersError && allUsers && allUsers.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Principal ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map(([principal, profile]) => {
                    return (
                      <TableRow key={principal.toString()}>
                        <TableCell className="font-medium">{profile.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {profile.accountType ? String(profile.accountType) : 'Not set'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[300px]">
                              {principal.toString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPrincipal(principal.toString())}
                              className="flex-shrink-0 h-6 w-6 p-0"
                            >
                              {copiedPrincipal === principal.toString() ? (
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
